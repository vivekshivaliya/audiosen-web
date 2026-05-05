"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { hearingTestContent } from "@/lib/content";
import { saveHearingTestSummary } from "@/lib/hearing-test-storage";
import type {
  HearingTestReliability,
  HearingTestSummary,
  HearingThreshold,
} from "@/lib/types";

const frequencies = [500, 1000, 2000, 4000] as const;
const ears = ["left", "right"] as const;

type Ear = (typeof ears)[number];
type TestPhase = "descending" | "ascending";

type ResultRow = {
  frequency: number;
  left: HearingThreshold;
  right: HearingThreshold;
  leftSeverity: string;
  rightSeverity: string;
};

type ReliabilityCounters = {
  total: number;
  passed: number;
  failed: number;
  silentFalsePositives: number;
};

type ReportSummary = HearingTestSummary & {
  rows: ResultRow[];
};

type HearingTestProps = {
  mode?: "home" | "page";
  onComplete?: (summary: HearingTestSummary) => void;
};

const earLabels: Record<Ear, string> = {
  left: "Left ear",
  right: "Right ear",
};

function toSeverity(level: HearingThreshold): string {
  if (level === "N/A") return "N/A";
  if (level <= 25) return "Normal";
  if (level <= 40) return "Mild loss";
  if (level <= 60) return "Moderate loss";
  return "Severe loss";
}

function formatThreshold(level: HearingThreshold): string {
  return level === "N/A" ? "N/A" : `${level} dB HL`;
}

function computePta(levels: Array<number | undefined>): HearingThreshold {
  const ptaLevels = levels.slice(0, 3).filter((value): value is number => value !== undefined);
  if (ptaLevels.length === 0) return "N/A";
  return Math.round(ptaLevels.reduce((sum, value) => sum + value, 0) / ptaLevels.length);
}

function getReliabilityLabel(reliability: HearingTestReliability): string {
  if (reliability === "good") return "Good reliability";
  if (reliability === "fair") return "Fair reliability";
  return "Low reliability - retest recommended";
}

function evaluateReliability(counters: ReliabilityCounters): HearingTestReliability {
  if (counters.total === 0) return "fair";
  const score = counters.passed / counters.total;

  if (counters.silentFalsePositives >= 2 || score < 0.55) return "low";
  if (counters.silentFalsePositives >= 1 || score < 0.8) return "fair";
  return "good";
}

function buildRecommendation(
  leftPta: HearingThreshold,
  rightPta: HearingThreshold,
  reliability: HearingTestReliability,
): string {
  if (reliability === "low") {
    return "Response consistency is low. Please retake the test in a quieter room, then confirm diagnosis at Audiosen Hearing Care Clinic.";
  }

  const worstLevel = [leftPta, rightPta].reduce<number | null>((current, value) => {
    if (value === "N/A") return current;
    return current === null ? value : Math.max(current, value);
  }, null);

  if (worstLevel === null) {
    return "No clear estimate was captured. Re-test once and then book diagnosis at Audiosen Hearing Care Clinic.";
  }

  if (worstLevel <= 25) {
    return "Screening looks within normal range. If speech still feels unclear, get a clinical hearing diagnosis at Audiosen Hearing Care Clinic.";
  }

  if (worstLevel <= 40) {
    return "Screening suggests mild hearing difficulty. Please book a full hearing diagnosis at Audiosen Hearing Care Clinic.";
  }

  if (worstLevel <= 60) {
    return "Screening suggests moderate hearing difficulty. A complete clinical diagnosis at Audiosen Hearing Care Clinic is strongly recommended soon.";
  }

  return "Screening suggests significant hearing difficulty. Please visit Audiosen Hearing Care Clinic for urgent full diagnosis.";
}

function buildReport(
  thresholds: Record<Ear, Array<number | undefined>>,
  reliabilityCounters: ReliabilityCounters,
): ReportSummary {
  const rows: ResultRow[] = frequencies.map((frequency, index) => {
    const left: HearingThreshold =
      thresholds.left[index] !== undefined ? Math.round(thresholds.left[index]!) : "N/A";
    const right: HearingThreshold =
      thresholds.right[index] !== undefined ? Math.round(thresholds.right[index]!) : "N/A";

    return {
      frequency,
      left,
      right,
      leftSeverity: toSeverity(left),
      rightSeverity: toSeverity(right),
    };
  });

  const leftPta = computePta(thresholds.left);
  const rightPta = computePta(thresholds.right);
  const reliability = evaluateReliability(reliabilityCounters);
  const notes = [...hearingTestContent.reportNotes];

  if (leftPta !== "N/A" && rightPta !== "N/A" && Math.abs(leftPta - rightPta) >= 15) {
    notes.unshift(
      `There is a meaningful difference between ears (${leftPta} dB vs ${rightPta} dB PTA). Please get an ear-specific clinical diagnosis.`,
    );
  }

  if (reliability === "low") {
    notes.unshift(
      "Response consistency was low in repeat/catch checks. Re-test and then confirm diagnosis at Audiosen Hearing Care Clinic.",
    );
  }

  return {
    rows,
    completedAt: new Date().toISOString(),
    leftPta,
    rightPta,
    leftSeverity: toSeverity(leftPta),
    rightSeverity: toSeverity(rightPta),
    reliability,
    reliabilityLabel: getReliabilityLabel(reliability),
    recommendation: buildRecommendation(leftPta, rightPta, reliability),
    notes,
  };
}

export function HearingTest({ mode = "home", onComplete }: HearingTestProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const outputNodeRef = useRef<AudioNode | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<((heard: boolean) => void) | null>(null);
  const testActiveRef = useRef(false);

  const earIndexRef = useRef(0);
  const freqIndexRef = useRef(0);
  const currentLevelRef = useRef(40);
  const phaseRef = useRef<TestPhase>("descending");
  const ascentHitsRef = useRef<Record<number, number>>({});
  const thresholdsRef = useRef<Record<Ear, Array<number | undefined>>>({
    left: [],
    right: [],
  });
  const reliabilityCountersRef = useRef<ReliabilityCounters>({
    total: 0,
    passed: 0,
    failed: 0,
    silentFalsePositives: 0,
  });

  const [testActive, setTestActive] = useState(false);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [status, setStatus] = useState(hearingTestContent.readyStatus);
  const [activeFrequency, setActiveFrequency] = useState<number | null>(null);
  const [activeEar, setActiveEar] = useState<Ear | null>(null);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  const [consentChecked, setConsentChecked] = useState(false);
  const [readyChecked, setReadyChecked] = useState(false);
  const [quickLevel, setQuickLevel] = useState(55);

  const sectionTitleClass = mode === "page" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  const panelClass = "premium-shell p-6 sm:p-8";

  const setupComplete = consentChecked && readyChecked;
  const totalSteps = ears.length * frequencies.length;
  const progressStep = summary ? totalSteps : currentStep;
  const progressPercent = Math.round((progressStep / totalSteps) * 100);

  function clearResponseTimeout() {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }

  function clearToneTimeout() {
    if (toneTimeoutRef.current) {
      clearTimeout(toneTimeoutRef.current);
      toneTimeoutRef.current = null;
    }
  }

  function cleanupAudio() {
    clearToneTimeout();

    const oscillator = oscillatorRef.current;
    if (oscillator) {
      try {
        oscillator.stop();
      } catch {
        // oscillator may already be stopped
      }
      oscillator.disconnect();
      oscillatorRef.current = null;
    }

    gainNodeRef.current?.disconnect();
    outputNodeRef.current?.disconnect();
    gainNodeRef.current = null;
    outputNodeRef.current = null;
  }

  async function ensureAudioContext(): Promise<AudioContext | null> {
    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        await audioCtxRef.current.resume();
        return audioCtxRef.current;
      }

      const ctx =
        new (
          window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext!
        )();

      audioCtxRef.current = ctx;
      await ctx.resume();
      return ctx;
    } catch {
      setStatus("Audio initialization failed. Please allow audio playback and retry.");
      return null;
    }
  }

  async function playTone(freq: number, levelDB: number, ear: Ear | "both") {
    const audioCtx = await ensureAudioContext();
    if (!audioCtx) return;

    cleanupAudio();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const amplitude = Math.min(0.7, Math.max(0.0005, Math.pow(10, (levelDB - 70) / 20)));
    const now = audioCtx.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    oscillator.connect(gainNode);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(amplitude, now + 0.03);
    gainNode.gain.setValueAtTime(amplitude, now + 0.45);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

    if (typeof StereoPannerNode !== "undefined") {
      const panValue = ear === "left" ? -1 : ear === "right" ? 1 : 0;
      const panner = new StereoPannerNode(audioCtx, { pan: panValue });
      gainNode.connect(panner);
      panner.connect(audioCtx.destination);
      outputNodeRef.current = panner;
    } else {
      gainNode.connect(audioCtx.destination);
      outputNodeRef.current = gainNode;
    }

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;
    oscillator.start();

    toneTimeoutRef.current = setTimeout(() => {
      cleanupAudio();
    }, 780);
  }

  async function playQuickTone(ear: Ear | "both") {
    await playTone(1000, quickLevel, ear);
  }

  function settleResponse(heard: boolean) {
    if (!resolveRef.current) return;
    clearResponseTimeout();
    setAwaitingResponse(false);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve(heard);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!awaitingResponse) return;
      const key = event.key.toLowerCase();
      if (key !== "y" && key !== "n") return;
      if (!resolveRef.current) return;

      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }

      setAwaitingResponse(false);
      const resolve = resolveRef.current;
      resolveRef.current = null;
      resolve(key === "y");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [awaitingResponse]);

  useEffect(() => {
    return () => {
      clearToneTimeout();
      clearResponseTimeout();

      const oscillator = oscillatorRef.current;
      if (oscillator) {
        try {
          oscillator.stop();
        } catch {
          // oscillator may already be stopped
        }
        oscillator.disconnect();
        oscillatorRef.current = null;
      }

      gainNodeRef.current?.disconnect();
      outputNodeRef.current?.disconnect();
      gainNodeRef.current = null;
      outputNodeRef.current = null;
    };
  }, []);

  async function waitForResponse(timeoutMs = 4200): Promise<boolean> {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setAwaitingResponse(true);
      responseTimeoutRef.current = setTimeout(() => {
        settleResponse(false);
      }, timeoutMs);
    });
  }

  function updateReliability(passed: boolean, isSilentCatch: boolean) {
    reliabilityCountersRef.current.total += 1;
    if (passed) {
      reliabilityCountersRef.current.passed += 1;
      return;
    }

    reliabilityCountersRef.current.failed += 1;
    if (isSilentCatch) {
      reliabilityCountersRef.current.silentFalsePositives += 1;
    }
  }

  async function runReliabilityProbe(ear: Ear, frequency: number, threshold: number, step: number) {
    if (!testActiveRef.current) return;

    setStatus(`Quick reliability check for step ${step} (${earLabels[ear]} ${frequency} Hz).`);
    await playTone(frequency, Math.min(80, threshold + 10), ear);
    const heardTone = await waitForResponse(2800);
    if (!testActiveRef.current) return;
    updateReliability(heardTone, false);
    cleanupAudio();

    if (step % 2 !== 0) return;

    setStatus("Silent catch check: click Yes only if you actually heard a tone.");
    const heardSilent = await waitForResponse(2400);
    if (!testActiveRef.current) return;
    updateReliability(!heardSilent, true);
  }

  function finishTest() {
    testActiveRef.current = false;
    setTestActive(false);
    setAwaitingResponse(false);
    setActiveFrequency(null);
    setActiveEar(null);
    setActiveLevel(null);
    setCurrentStep(totalSteps);
    setStatus("Screening completed. Review your report and next steps below.");

    const report = buildReport(thresholdsRef.current, reliabilityCountersRef.current);
    trackEvent("hearing_test_complete", {
      left_pta: report.leftPta === "N/A" ? "N/A" : report.leftPta,
      right_pta: report.rightPta === "N/A" ? "N/A" : report.rightPta,
      reliability: report.reliability,
      left_severity: report.leftSeverity,
      right_severity: report.rightSeverity,
    });
    setSummary(report);
  }

  async function finalizeCurrentFrequency(threshold: number) {
    const ear = ears[earIndexRef.current];
    const frequency = frequencies[freqIndexRef.current];
    const step = earIndexRef.current * frequencies.length + freqIndexRef.current + 1;

    thresholdsRef.current[ear][freqIndexRef.current] = threshold;
    await runReliabilityProbe(ear, frequency, threshold, step);
    if (!testActiveRef.current) return;

    if (freqIndexRef.current < frequencies.length - 1) {
      freqIndexRef.current += 1;
    } else if (earIndexRef.current < ears.length - 1) {
      earIndexRef.current += 1;
      freqIndexRef.current = 0;
    } else {
      finishTest();
      return;
    }

    phaseRef.current = "descending";
    currentLevelRef.current = 40;
    ascentHitsRef.current = {};
    await presentToneSequence();
  }

  async function handleResponse(heard: boolean) {
    const level = currentLevelRef.current;

    if (phaseRef.current === "descending") {
      if (heard) {
        if (level <= 0) {
          await finalizeCurrentFrequency(0);
          return;
        }
        currentLevelRef.current = Math.max(0, level - 10);
      } else {
        phaseRef.current = "ascending";
        currentLevelRef.current = Math.min(80, level + 5);
      }
    } else if (heard) {
      const hitCount = (ascentHitsRef.current[level] ?? 0) + 1;
      ascentHitsRef.current[level] = hitCount;

      if (hitCount >= 2) {
        await finalizeCurrentFrequency(level);
        return;
      }

      phaseRef.current = "descending";
      currentLevelRef.current = Math.max(0, level - 10);
    } else {
      if (level >= 80) {
        await finalizeCurrentFrequency(80);
        return;
      }
      currentLevelRef.current = Math.min(80, level + 5);
    }

    await presentToneSequence();
  }

  async function presentToneSequence() {
    if (!testActiveRef.current) return;

    const ear = ears[earIndexRef.current];
    const frequency = frequencies[freqIndexRef.current];
    const level = currentLevelRef.current;
    const step = earIndexRef.current * frequencies.length + freqIndexRef.current + 1;
    const phaseLabel = phaseRef.current === "descending" ? "finding threshold" : "confirming";

    setCurrentStep(step);
    setActiveEar(ear);
    setActiveFrequency(frequency);
    setActiveLevel(level);
    setStatus(
      `Step ${step}/${totalSteps}: ${earLabels[ear]}, ${frequency} Hz, ${Math.round(level)} dB HL (${phaseLabel}).`,
    );

    await playTone(frequency, level, ear);
    const heard = await waitForResponse();
    if (!testActiveRef.current) return;
    cleanupAudio();
    await handleResponse(heard);
  }

  async function startTest() {
    if (!setupComplete) {
      setStatus("Please complete the two start confirmations before testing.");
      return;
    }

    const ctx = await ensureAudioContext();
    if (!ctx) return;
    trackEvent("hearing_test_start", {
      test_variant: mode,
    });

    cleanupAudio();
    clearResponseTimeout();
    resolveRef.current = null;
    thresholdsRef.current = { left: [], right: [] };
    reliabilityCountersRef.current = {
      total: 0,
      passed: 0,
      failed: 0,
      silentFalsePositives: 0,
    };
    earIndexRef.current = 0;
    freqIndexRef.current = 0;
    currentLevelRef.current = 40;
    phaseRef.current = "descending";
    ascentHitsRef.current = {};
    setCurrentStep(0);
    setSummary(null);

    testActiveRef.current = true;
    setTestActive(true);
    setStatus("Starting test. Listen carefully and answer each tone.");
    await presentToneSequence();
  }

  function saveAndContinueToContact() {
    if (!summary) return;
    trackEvent("hearing_test_report_book_click", {
      reliability: summary.reliability,
      test_variant: mode,
    });
    saveHearingTestSummary(summary);
    onComplete?.(summary);
  }

  const heading =
    activeEar && activeFrequency && activeLevel !== null
      ? `${earLabels[activeEar]} | ${activeFrequency} Hz | ${activeLevel} dB HL`
      : "Ear-by-ear screening for left and right hearing";

  return (
    <div className={panelClass}>
      <div className="mb-5">
        <h3 className={`font-display font-semibold text-slate-900 ${sectionTitleClass}`}>
          {hearingTestContent.title}
        </h3>
        <p className="premium-prose mt-2 max-w-3xl text-sm sm:text-base">
          Easy self-check with clear instructions and diagnosis guidance for Audiosen Hearing Care Clinic.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="premium-card-soft p-4">
          <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-sky-800">
            How to use in 4 easy steps
          </h4>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
            <li>Wear stereo headphones and sit in a quiet room.</li>
            <li>Use quick sound check once to set comfortable volume.</li>
            <li>Press Start Test and answer each tone using Yes/No buttons.</li>
            <li>Review report and confirm diagnosis at a nearby hearing clinic.</li>
          </ol>
          <p className="mt-3 text-sm text-slate-700">{hearingTestContent.helper}</p>
        </article>

        <article className="premium-card-soft p-4">
          <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-amber-800">
            Important safety notes
          </h4>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
            {hearingTestContent.whoShouldNotRely.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-600">{hearingTestContent.disclaimer}</p>
        </article>
      </div>

      <div className="premium-card mt-5 p-4 sm:p-5">
        <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">
          Quick start confirmations
        </h4>
        <div className="mt-3 grid gap-3 text-sm text-slate-700">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={readyChecked}
              onChange={(event) => setReadyChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>I am in a quiet room and I am using stereo headphones/earphones.</span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(event) => setConsentChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>I understand this is a screening estimate and not a final medical diagnosis.</span>
          </label>
        </div>
      </div>

      <div className="premium-card mt-4 p-4 sm:p-5">
        <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-900">
          Optional quick sound check
        </h4>
        <p className="mt-2 text-sm text-slate-700">
          Set a comfortable level first, then play a short beep in each ear.
        </p>
        <input
          type="range"
          min={35}
          max={75}
          step={1}
          value={quickLevel}
          onChange={(event) => setQuickLevel(Number(event.target.value))}
          className="mt-3 w-full"
        />
        <div className="mt-2 text-xs font-semibold text-slate-600">Volume level: {quickLevel} dB HL</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => playQuickTone("left")}
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            Play Left
          </button>
          <button
            type="button"
            onClick={() => playQuickTone("right")}
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            Play Right
          </button>
          <button
            type="button"
            onClick={() => playQuickTone("both")}
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
          >
            Play Center
          </button>
        </div>
      </div>

      <div className="premium-card mt-4 px-4 py-4 text-center text-sm font-semibold text-slate-700">
        {status}
      </div>

      <div className="mt-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-2 bg-sky-700 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>
      <p className="mt-2 text-center text-xs font-semibold text-slate-600">
        Progress: {progressStep}/{totalSteps}
      </p>

      <div className="min-h-8 pt-3 text-center text-sm font-semibold text-sky-800">{heading}</div>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={startTest}
          disabled={testActive || !setupComplete}
          className="premium-button-primary disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-400"
        >
          {summary ? "Restart Test" : "Start Test"}
        </button>
        <button
          type="button"
          onClick={() => settleResponse(true)}
          disabled={!awaitingResponse}
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Yes, I Heard It
        </button>
        <button
          type="button"
          onClick={() => settleResponse(false)}
          disabled={!awaitingResponse}
          className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          No, I Did Not Hear It
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-slate-600">
        Tip: during the test you can also press <strong>Y</strong> for Yes and <strong>N</strong> for No.
      </p>

      {summary ? (
        <div className="mt-7 space-y-5">
          <article className="premium-card p-5">
            <h4 className="text-lg font-bold text-sky-800">{hearingTestContent.resultTitle}</h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{summary.recommendation}</p>
            <p className="mt-2 text-xs text-slate-500">
              Completed at: {new Date(summary.completedAt).toLocaleString("en-IN", { hour12: true })}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Left Ear PTA</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{formatThreshold(summary.leftPta)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{summary.leftSeverity}</p>
              </div>
              <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Right Ear PTA</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{formatThreshold(summary.rightPta)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{summary.rightSeverity}</p>
              </div>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Reliability</p>
                <p className="mt-2 text-xl font-black text-slate-900">{summary.reliabilityLabel}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Reliability helps estimate how consistent your answers were.
                </p>
              </div>
            </div>
          </article>

          <article className="premium-card p-5">
            <h4 className="text-base font-bold text-slate-900">Frequency-by-frequency results</h4>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-3 bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
                <div className="px-4 py-3">Frequency</div>
                <div className="px-4 py-3">Left Ear</div>
                <div className="px-4 py-3">Right Ear</div>
              </div>
              {summary.rows.map((row) => (
                <div
                  key={row.frequency}
                  className="grid grid-cols-3 border-t border-slate-200 text-sm text-slate-700"
                >
                  <div className="px-4 py-3 font-semibold">{row.frequency} Hz</div>
                  <div className="px-4 py-3">
                    {formatThreshold(row.left)} | {row.leftSeverity}
                  </div>
                  <div className="px-4 py-3">
                    {formatThreshold(row.right)} | {row.rightSeverity}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="premium-card p-5">
            <h4 className="text-base font-bold text-slate-900">How to read your result</h4>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
              {hearingTestContent.interpretationGuide.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <h4 className="mt-5 text-base font-bold text-slate-900">Report notes</h4>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-slate-700">
              {summary.notes.map((note) => (
                <li key={note} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">{hearingTestContent.disclaimer}</p>
          </article>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/#contact"
              onClick={saveAndContinueToContact}
              className="premium-button-primary"
            >
              Book Consultation with this Report
            </Link>
            <button
              type="button"
              onClick={startTest}
              className="inline-flex rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Re-test Now
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
