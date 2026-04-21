"use client";

import { useEffect, useRef, useState } from "react";
import { hearingTestContent } from "@/lib/content";

const frequencies = [500, 1000, 2000, 4000] as const;
const ears = ["left", "right"] as const;

type Ear = (typeof ears)[number];
type Threshold = number | "N/A";
type TestPhase = "descending" | "ascending";

type ResultRow = {
  frequency: number;
  left: Threshold;
  right: Threshold;
  leftSeverity: string;
  rightSeverity: string;
};

type ReportSummary = {
  leftPta: Threshold;
  rightPta: Threshold;
  leftSeverity: string;
  rightSeverity: string;
  recommendation: string;
  notes: string[];
};

const earLabels: Record<Ear, string> = {
  left: "Left ear",
  right: "Right ear",
};

function toSeverity(level: Threshold): string {
  if (level === "N/A") return "N/A";
  if (level <= 25) return "Normal";
  if (level <= 40) return "Mild loss";
  if (level <= 60) return "Moderate loss";
  return "Severe loss";
}

function formatThreshold(level: Threshold): string {
  return level === "N/A" ? "N/A" : `${level} dB HL`;
}

function computePta(levels: Array<number | undefined>): Threshold {
  const ptaLevels = levels.slice(0, 3).filter((value): value is number => value !== undefined);
  if (ptaLevels.length === 0) return "N/A";
  return Math.round(ptaLevels.reduce((sum, value) => sum + value, 0) / ptaLevels.length);
}

function buildRecommendation(leftPta: Threshold, rightPta: Threshold): string {
  const worstLevel = [leftPta, rightPta].reduce<number | null>((current, value) => {
    if (value === "N/A") return current;
    return current === null ? value : Math.max(current, value);
  }, null);

  if (worstLevel === null) {
    return "No clear threshold estimate was captured. Re-test in a quieter room with stereo headphones or book a clinic screening.";
  }

  if (worstLevel <= 25) {
    return "Your screening looks within the normal hearing range. If you still struggle in noise, speech clarity, or tinnitus, book a full hearing consultation.";
  }

  if (worstLevel <= 40) {
    return "This screening suggests mild hearing difficulty. A full hearing evaluation and early hearing care consultation would be helpful.";
  }

  if (worstLevel <= 60) {
    return "This screening suggests moderate hearing difficulty. A complete audiology evaluation and hearing solution consultation is strongly recommended.";
  }

  return "This screening suggests significant hearing difficulty. Please arrange a comprehensive hearing evaluation and hearing care consultation as soon as possible.";
}

function buildReport(
  thresholds: Record<Ear, Array<number | undefined>>,
): { rows: ResultRow[]; summary: ReportSummary } {
  const rows: ResultRow[] = frequencies.map((frequency, index) => {
    const left: Threshold = thresholds.left[index] !== undefined ? Math.round(thresholds.left[index]!) : "N/A";
    const right: Threshold =
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
  const notes = [...hearingTestContent.reportNotes];

  if (leftPta !== "N/A" && rightPta !== "N/A" && Math.abs(leftPta - rightPta) >= 15) {
    notes.unshift(
      `There is a meaningful difference between your ears (${leftPta} dB vs ${rightPta} dB PTA). Please arrange a full ear-specific diagnostic evaluation.`,
    );
  }

  const leftHighFrequency = thresholds.left[3];
  const rightHighFrequency = thresholds.right[3];

  if (leftPta !== "N/A" && leftHighFrequency !== undefined && leftHighFrequency - leftPta >= 15) {
    notes.unshift(
      "Your left ear shows a bigger drop at 4000 Hz, which can be associated with early high-frequency hearing difficulty.",
    );
  }

  if (
    rightPta !== "N/A" &&
    rightHighFrequency !== undefined &&
    rightHighFrequency - rightPta >= 15
  ) {
    notes.unshift(
      "Your right ear shows a bigger drop at 4000 Hz, which can be associated with early high-frequency hearing difficulty.",
    );
  }

  if (leftPta !== "N/A" && rightPta !== "N/A" && leftPta <= 25 && rightPta <= 25) {
    notes.unshift(
      "Both ears screened within the normal range for pure tones, but clinic speech testing is still useful if you struggle in meetings or noisy environments.",
    );
  }

  return {
    rows,
    summary: {
      leftPta,
      rightPta,
      leftSeverity: toSeverity(leftPta),
      rightSeverity: toSeverity(rightPta),
      recommendation: buildRecommendation(leftPta, rightPta),
      notes,
    },
  };
}

export function HearingTest() {
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

  const [testActive, setTestActive] = useState(false);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [status, setStatus] = useState(hearingTestContent.readyStatus);
  const [activeFrequency, setActiveFrequency] = useState<number | null>(null);
  const [activeEar, setActiveEar] = useState<Ear | null>(null);
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

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
        // oscillator can already be stopped
      }
      oscillator.disconnect();
      oscillatorRef.current = null;
    }

    gainNodeRef.current?.disconnect();
    outputNodeRef.current?.disconnect();
    gainNodeRef.current = null;
    outputNodeRef.current = null;
  }

  function playTone(freq: number, levelDB: number, ear: Ear) {
    const audioCtx =
      audioCtxRef.current ??
      new (
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext!
      )();

    audioCtxRef.current = audioCtx;
    cleanupAudio();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const amplitude = Math.min(0.7, Math.max(0.0005, Math.pow(10, (levelDB - 70) / 20)));
    const now = audioCtx.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.value = freq;

    oscillator.connect(gainNode);
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(amplitude, now + 0.04);
    gainNode.gain.setValueAtTime(amplitude, now + 0.55);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);

    if (typeof StereoPannerNode !== "undefined") {
      const panner = new StereoPannerNode(audioCtx, { pan: ear === "left" ? -1 : 1 });
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
    }, 900);
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
    return () => {
      clearToneTimeout();
      clearResponseTimeout();

      const oscillator = oscillatorRef.current;
      if (oscillator) {
        try {
          oscillator.stop();
        } catch {
          // oscillator can already be stopped
        }
        oscillator.disconnect();
      }

      gainNodeRef.current?.disconnect();
      outputNodeRef.current?.disconnect();
    };
  }, []);

  async function waitForResponse(): Promise<boolean> {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setAwaitingResponse(true);
      responseTimeoutRef.current = setTimeout(() => {
        settleResponse(false);
      }, 4000);
    });
  }

  function finishTest() {
    testActiveRef.current = false;
    setTestActive(false);
    setAwaitingResponse(false);
    setActiveFrequency(null);
    setActiveEar(null);
    setActiveLevel(null);
    setStatus("Screening completed. Review your left and right ear report below.");

    const report = buildReport(thresholdsRef.current);
    setResults(report.rows);
    setSummary(report.summary);
  }

  async function finalizeCurrentFrequency(threshold: number) {
    const ear = ears[earIndexRef.current];
    thresholdsRef.current[ear][freqIndexRef.current] = threshold;

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
    } else {
      if (heard) {
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
    }

    await presentToneSequence();
  }

  async function presentToneSequence() {
    if (!testActiveRef.current) return;

    const ear = ears[earIndexRef.current];
    const frequency = frequencies[freqIndexRef.current];
    const level = currentLevelRef.current;
    const phaseLabel =
      phaseRef.current === "descending" ? "refining threshold" : "confirming threshold";
    const step = earIndexRef.current * frequencies.length + freqIndexRef.current + 1;

    setActiveEar(ear);
    setActiveFrequency(frequency);
    setActiveLevel(level);
    setStatus(
      `Step ${step} of ${ears.length * frequencies.length}: ${earLabels[ear]} • ${frequency} Hz • ${Math.round(level)} dB HL (${phaseLabel}).`,
    );

    playTone(frequency, level, ear);
    const heard = await waitForResponse();

    if (!testActiveRef.current) return;

    cleanupAudio();
    await handleResponse(heard);
  }

  async function startTest() {
    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        await audioCtxRef.current.close();
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
    } catch {
      setStatus("Audio initialization failed. Please allow audio playback and retry.");
      return;
    }

    cleanupAudio();
    clearResponseTimeout();
    resolveRef.current = null;
    thresholdsRef.current = { left: [], right: [] };
    earIndexRef.current = 0;
    freqIndexRef.current = 0;
    currentLevelRef.current = 40;
    phaseRef.current = "descending";
    ascentHitsRef.current = {};
    setResults(null);
    setSummary(null);

    testActiveRef.current = true;
    setTestActive(true);
    setStatus("Initializing left ear screening. Listen carefully and answer every tone.");
    await presentToneSequence();
  }

  const heading =
    activeEar && activeFrequency && activeLevel !== null
      ? `${earLabels[activeEar]} • ${activeFrequency} Hz • ${activeLevel} dB HL`
      : "Ear-by-ear screening for left and right hearing";

  return (
    <div className="rounded-[2rem] border border-sky-100 bg-gradient-to-br from-[#eef8ff] to-[#e3f1fb] p-6 shadow-[0_16px_40px_-22px_rgba(8,68,119,0.45)] sm:p-8">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl bg-sky-50 px-4 py-4 text-sm text-sky-900">
          <p className="font-semibold">Testing instructions</p>
          <p className="mt-2 leading-relaxed">{hearingTestContent.helper}</p>
        </div>

        <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">What this report includes</p>
          <p className="mt-2 leading-relaxed">
            Left and right ear screening thresholds, PTA summary, severity estimate, pattern notes,
            and next-step recommendations for hearing care follow-up.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-center text-sm font-semibold text-slate-700">
        {status}
      </div>

      <div className="min-h-8 pt-3 text-center text-sm font-semibold text-sky-800">{heading}</div>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={startTest}
          disabled={testActive}
          className="rounded-full bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {results ? "Restart Test" : "Start Test"}
        </button>
        <button
          type="button"
          onClick={() => settleResponse(true)}
          disabled={!awaitingResponse}
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Yes, I Hear It
        </button>
        <button
          type="button"
          onClick={() => settleResponse(false)}
          disabled={!awaitingResponse}
          className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          No, I Don&apos;t Hear It
        </button>
      </div>

      {summary && results ? (
        <div className="mt-7 space-y-5">
          <div className="rounded-2xl bg-white p-5">
            <h3 className="text-lg font-bold text-sky-800">{hearingTestContent.resultTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{summary.recommendation}</p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">
                  Left Ear PTA
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatThreshold(summary.leftPta)}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Estimated severity: {summary.leftSeverity}
                </p>
              </article>

              <article className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                  Right Ear PTA
                </p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatThreshold(summary.rightPta)}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Estimated severity: {summary.rightSeverity}
                </p>
              </article>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5">
            <h4 className="text-base font-bold text-slate-900">Frequency-by-frequency results</h4>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-3 bg-slate-100 text-xs font-bold uppercase tracking-wide text-slate-600">
                <div className="px-4 py-3">Frequency</div>
                <div className="px-4 py-3">Left Ear</div>
                <div className="px-4 py-3">Right Ear</div>
              </div>
              {results.map((row) => (
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
          </div>

          <div className="rounded-2xl bg-white p-5">
            <h4 className="text-base font-bold text-slate-900">Report notes</h4>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
              {summary.notes.map((note) => (
                <li key={note} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {note}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">{hearingTestContent.disclaimer}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
