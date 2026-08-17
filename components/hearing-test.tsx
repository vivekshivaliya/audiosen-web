"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { callHref, hearingTestContent } from "@/lib/content";
import { saveHearingTestSummary } from "@/lib/hearing-test-storage";
import type {
  DeviceHearingResult,
  HearingTestReliability,
  HearingTestSummary,
} from "@/lib/types";

const frequencies = [500, 1000, 2000, 4000] as const;
const ears = ["left", "right"] as const;

type Ear = (typeof ears)[number];
type TriageChoice = "unanswered" | "none" | "urgent";
type Trial = {
  id: string;
  ear: Ear;
  frequency: number | null;
  kind: "tone" | "repeat" | "silent";
};

type QualityCounters = {
  total: number;
  passed: number;
  silentFalsePositives: number;
};

type HearingTestProps = {
  mode?: "home" | "page";
  onComplete?: (summary: HearingTestSummary) => void;
};

const earLabels: Record<Ear, string> = {
  left: "Left ear",
  right: "Right ear",
};

const trials: Trial[] = [
  ...frequencies.map((frequency) => ({
    id: `left-${frequency}`,
    ear: "left" as const,
    frequency,
    kind: "tone" as const,
  })),
  { id: "left-silent", ear: "left", frequency: null, kind: "silent" },
  { id: "left-repeat", ear: "left", frequency: 1000, kind: "repeat" },
  ...frequencies.map((frequency) => ({
    id: `right-${frequency}`,
    ear: "right" as const,
    frequency,
    kind: "tone" as const,
  })),
  { id: "right-silent", ear: "right", frequency: null, kind: "silent" },
  { id: "right-repeat", ear: "right", frequency: 1000, kind: "repeat" },
];

function evaluateReliability(counters: QualityCounters): HearingTestReliability {
  if (counters.total === 0) return "low";
  const score = counters.passed / counters.total;
  if (score >= 0.75 && counters.silentFalsePositives === 0) return "good";
  if (score >= 0.5) return "fair";
  return "low";
}

function reliabilityLabel(value: HearingTestReliability): string {
  if (value === "good") return "Consistent";
  if (value === "fair") return "Mixed";
  return "Please repeat";
}

function resultFromCount(detected: number): DeviceHearingResult {
  if (detected === frequencies.length) return "all-noticed";
  if (detected >= 2) return "some-missed";
  return "several-missed";
}

function resultLabel(result: DeviceHearingResult): string {
  if (result === "all-noticed") return "All check tones noticed";
  if (result === "some-missed") return "Some tones were difficult";
  if (result === "several-missed") return "Several tones were difficult";
  return "Not completed";
}

function buildRecommendation(
  leftDetected: number,
  rightDetected: number,
  reliability: HearingTestReliability,
): string {
  if (reliability === "low") {
    return "Your responses varied during repeat and silent checks. Try again in a quieter room before using this result to choose a next step.";
  }

  const missed = frequencies.length * 2 - leftDetected - rightDetected;
  if (missed <= 1) {
    return "No clear difficulty was detected in this device check. This does not rule out hearing loss—book an assessment if speech, phone calls, tinnitus, or noisy places are difficult.";
  }
  if (missed <= 3) {
    return "Some tone regions were difficult on this device. A clinic hearing assessment is a sensible next step, especially if you notice everyday communication difficulty.";
  }
  return "Several tone regions were difficult on this device. Please arrange a clinic hearing assessment so calibrated equipment can measure your hearing and guide care.";
}

function buildSummary(
  responses: Record<Ear, boolean[]>,
  counters: QualityCounters,
): HearingTestSummary {
  const leftDetected = responses.left.filter(Boolean).length;
  const rightDetected = responses.right.filter(Boolean).length;
  const reliability = evaluateReliability(counters);
  const notes = [...hearingTestContent.reportNotes];

  if (Math.abs(leftDetected - rightDetected) >= 2) {
    notes.unshift(
      "The two ears responded differently in this device check. A clinic ear-by-ear assessment is recommended.",
    );
  }
  if (reliability === "low") {
    notes.unshift("Response consistency was low, so repeat the check before interpreting it.");
  }

  return {
    completedAt: new Date().toISOString(),
    leftResult: resultFromCount(leftDetected),
    rightResult: resultFromCount(rightDetected),
    leftDetected,
    rightDetected,
    totalPerEar: frequencies.length,
    reliability,
    reliabilityLabel: reliabilityLabel(reliability),
    recommendation: buildRecommendation(leftDetected, rightDetected, reliability),
    notes,
  };
}

export function HearingTest({ mode = "home", onComplete }: HearingTestProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const outputNodeRef = useRef<AudioNode | null>(null);
  const toneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveRef = useRef<((heard: boolean | null) => void) | null>(null);
  const testActiveRef = useRef(false);
  const responsesRef = useRef<Record<Ear, boolean[]>>({ left: [], right: [] });
  const qualityRef = useRef<QualityCounters>({ total: 0, passed: 0, silentFalsePositives: 0 });

  const [triage, setTriage] = useState<TriageChoice>("unanswered");
  const [readyChecked, setReadyChecked] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [referenceLevel, setReferenceLevel] = useState(42);
  const [testActive, setTestActive] = useState(false);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState(hearingTestContent.readyStatus);
  const [summary, setSummary] = useState<HearingTestSummary | null>(null);

  const setupComplete =
    triage === "none" && readyChecked && ageChecked && consentChecked;
  const progressPercent = summary
    ? 100
    : Math.round((currentStep / trials.length) * 100);
  const panelClass = mode === "page" ? "sonic-test-shell" : "sonic-test-shell sonic-test-compact";

  function clearToneTimeout() {
    if (!toneTimeoutRef.current) return;
    clearTimeout(toneTimeoutRef.current);
    toneTimeoutRef.current = null;
  }

  function clearResponseTimeout() {
    if (!responseTimeoutRef.current) return;
    clearTimeout(responseTimeoutRef.current);
    responseTimeoutRef.current = null;
  }

  function cleanupAudio() {
    clearToneTimeout();
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // The oscillator may already have stopped.
      }
      oscillatorRef.current.disconnect();
    }
    gainNodeRef.current?.disconnect();
    outputNodeRef.current?.disconnect();
    oscillatorRef.current = null;
    gainNodeRef.current = null;
    outputNodeRef.current = null;
  }

  async function ensureAudioContext(): Promise<AudioContext | null> {
    try {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        await audioCtxRef.current.resume();
        return audioCtxRef.current;
      }
      const AudioContextConstructor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error("Audio context unavailable");
      const context = new AudioContextConstructor();
      audioCtxRef.current = context;
      await context.resume();
      return context;
    } catch {
      setStatus("Audio could not start. Allow audio playback, reconnect headphones, and retry.");
      return null;
    }
  }

  async function playTone(frequency: number, level: number, ear: Ear | "both") {
    const context = await ensureAudioContext();
    if (!context) return false;
    cleanupAudio();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const amplitude = Math.min(0.07, Math.max(0.008, (level / 100) * 0.08));
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(amplitude, now + 0.04);
    gain.gain.setValueAtTime(amplitude, now + 0.48);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.76);

    if (typeof StereoPannerNode !== "undefined") {
      const panner = new StereoPannerNode(context, {
        pan: ear === "left" ? -1 : ear === "right" ? 1 : 0,
      });
      gain.connect(panner);
      panner.connect(context.destination);
      outputNodeRef.current = panner;
    } else {
      gain.connect(context.destination);
      outputNodeRef.current = gain;
    }

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gain;
    oscillator.start();
    toneTimeoutRef.current = setTimeout(cleanupAudio, 820);
    return true;
  }

  function settleResponse(heard: boolean) {
    if (!resolveRef.current) return;
    clearResponseTimeout();
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setAwaitingResponse(false);
    resolve(heard);
  }

  function waitForResponse(): Promise<boolean | null> {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setAwaitingResponse(true);
      responseTimeoutRef.current = setTimeout(() => {
        resolveRef.current = null;
        setAwaitingResponse(false);
        resolve(null);
      }, 5200);
    });
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
      const resolve = resolveRef.current;
      resolveRef.current = null;
      setAwaitingResponse(false);
      resolve(key === "y");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [awaitingResponse]);

  useEffect(() => {
    return () => {
      testActiveRef.current = false;
      if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
      if (toneTimeoutRef.current) clearTimeout(toneTimeoutRef.current);
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
        } catch {
          // The oscillator may already have stopped.
        }
        oscillatorRef.current.disconnect();
      }
      gainNodeRef.current?.disconnect();
      outputNodeRef.current?.disconnect();
    };
  }, []);

  async function playReference(ear: Ear | "both") {
    setStatus("Playing a comfortable reference sound. Lower your device volume if it feels loud.");
    await playTone(1000, referenceLevel, ear);
  }

  function stopTest() {
    testActiveRef.current = false;
    setTestActive(false);
    setAwaitingResponse(false);
    setCurrentTrial(null);
    clearResponseTimeout();
    cleanupAudio();
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(null);
    setStatus("Check stopped. You can restart when you are ready.");
  }

  async function startTest() {
    if (!setupComplete) {
      setStatus("Complete the safety and setup confirmations before starting.");
      return;
    }
    if (!(await ensureAudioContext())) return;

    trackEvent("hearing_test_start", { test_variant: mode, result_model: "device_relative_v2" });
    responsesRef.current = { left: [], right: [] };
    qualityRef.current = { total: 0, passed: 0, silentFalsePositives: 0 };
    setSummary(null);
    setCurrentStep(0);
    testActiveRef.current = true;
    setTestActive(true);

    for (let index = 0; index < trials.length; index += 1) {
      if (!testActiveRef.current) return;
      const trial = trials[index];
      setCurrentTrial(trial);
      setCurrentStep(index + 1);

      if (trial.kind === "silent") {
        setStatus(`${earLabels[trial.ear]} response check. Answer only if you notice a tone.`);
      } else {
        setStatus(
          trial.kind === "repeat"
            ? `${earLabels[trial.ear]} consistency check. Listen once more.`
            : `${earLabels[trial.ear]} · tone region ${frequencies.indexOf(trial.frequency as (typeof frequencies)[number]) + 1} of 4`,
        );
        await playTone(trial.frequency!, Math.max(18, referenceLevel * 0.62), trial.ear);
      }

      const heard = await waitForResponse();
      cleanupAudio();
      if (!testActiveRef.current) return;

      if (trial.kind === "tone") {
        responsesRef.current[trial.ear].push(heard === true);
      } else {
        qualityRef.current.total += 1;
        if (trial.kind === "silent") {
          if (heard === false) qualityRef.current.passed += 1;
          if (heard === true) qualityRef.current.silentFalsePositives += 1;
        } else {
          const original = responsesRef.current[trial.ear][1] ?? false;
          if (heard !== null && heard === original) qualityRef.current.passed += 1;
        }
      }
    }

    testActiveRef.current = false;
    setTestActive(false);
    setAwaitingResponse(false);
    setCurrentTrial(null);
    setCurrentStep(trials.length);
    setStatus("Device check complete. Review what you noticed and the recommended next step.");

    const report = buildSummary(responsesRef.current, qualityRef.current);
    setSummary(report);
    trackEvent("hearing_test_complete", {
      left_tones_noticed: report.leftDetected,
      right_tones_noticed: report.rightDetected,
      response_consistency: report.reliability,
      result_model: "device_relative_v2",
    });
  }

  function saveAndContinueToContact() {
    if (!summary) return;
    saveHearingTestSummary(summary);
    onComplete?.(summary);
    trackEvent("hearing_test_report_book_click", {
      reliability: summary.reliability,
      test_variant: mode,
      result_model: "device_relative_v2",
    });
  }

  return (
    <div className={panelClass}>
      <div className="sonic-test-intro">
        <div>
          <p className="premium-eyebrow">Private · about 4 minutes · no account</p>
          <h2 className="sonic-test-title">{hearingTestContent.title}</h2>
          <p className="premium-prose mt-3 max-w-3xl">{hearingTestContent.subtitle}</p>
        </div>
        <div className="sonic-privacy-orb" aria-label="Results stay private until you choose to share">
          <span aria-hidden="true">◌</span>
          <strong>Local-first</strong>
          <small>Share only when you choose</small>
        </div>
      </div>

      <div className="sonic-safety-grid">
        <section className="sonic-step-card">
          <span className="sonic-step-number">01</span>
          <h3>Safety route</h3>
          <p>Do any urgent warning signs apply right now?</p>
          <div className="mt-4 grid gap-3">
            <label className={`sonic-choice ${triage === "none" ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="triage"
                checked={triage === "none"}
                onChange={() => setTriage("none")}
              />
              <span>
                <strong>No urgent warning signs</strong>
                <small>No sudden change, severe pain, discharge, injury, or significant dizziness.</small>
              </span>
            </label>
            <label className={`sonic-choice sonic-choice-alert ${triage === "urgent" ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="triage"
                checked={triage === "urgent"}
                onChange={() => setTriage("urgent")}
              />
              <span>
                <strong>One or more warning signs apply</strong>
                <small>Skip this check and seek prompt medical assessment.</small>
              </span>
            </label>
          </div>
        </section>

        <section className="sonic-step-card">
          <span className="sonic-step-number">02</span>
          <h3>Listening setup</h3>
          <div className="mt-4 grid gap-3">
            <label className="sonic-check-row">
              <input type="checkbox" checked={ageChecked} onChange={(event) => setAgeChecked(event.target.checked)} />
              <span>I am 18 or older. Children should have a pediatric clinic assessment.</span>
            </label>
            <label className="sonic-check-row">
              <input type="checkbox" checked={readyChecked} onChange={(event) => setReadyChecked(event.target.checked)} />
              <span>I am in a quiet room using stereo headphones or earphones.</span>
            </label>
            <label className="sonic-check-row">
              <input type="checkbox" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} />
              <span>I understand this is an uncalibrated device check, not an audiogram or diagnosis.</span>
            </label>
          </div>
        </section>
      </div>

      {triage === "urgent" ? (
        <section className="sonic-urgent-card" role="alert">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em]">Stop the online check</p>
            <h3>Seek prompt medical assessment</h3>
            <p>Sudden hearing change or symptoms with pain, discharge, injury, dizziness, or neurological changes need medical attention—not a browser result.</p>
          </div>
          <a href={callHref} className="premium-button-primary">Call Audiosen for guidance</a>
        </section>
      ) : null}

      <section className="sonic-calibration-card">
        <div>
          <span className="sonic-step-number">03</span>
          <h3>Set one comfortable reference</h3>
          <p>Start low. Adjust your device volume first, then use this fine control. Never increase volume just to hear a test tone.</p>
        </div>
        <div className="sonic-level-control">
          <label htmlFor={`reference-level-${mode}`}>
            Reference signal <strong>{referenceLevel < 38 ? "Low" : referenceLevel < 56 ? "Comfortable" : "Upper comfort"}</strong>
          </label>
          <input
            id={`reference-level-${mode}`}
            type="range"
            min={25}
            max={65}
            value={referenceLevel}
            onChange={(event) => setReferenceLevel(Number(event.target.value))}
          />
          <div className="sonic-reference-actions">
            <button type="button" onClick={() => void playReference("left")}>Play left</button>
            <button type="button" onClick={() => void playReference("right")}>Play right</button>
            <button type="button" onClick={() => void playReference("both")}>Play centre</button>
          </div>
        </div>
      </section>

      <section className={`sonic-test-chamber ${testActive ? "is-listening" : ""}`}>
        <div className="sonic-ear-stage" aria-hidden="true">
          <span className={`sonic-ear-orb sonic-ear-left ${currentTrial?.ear === "left" ? "is-active" : ""}`}>L</span>
          <div className="sonic-wave-core">
            <i />
            <i />
            <i />
            <span>{testActive ? "Listening" : summary ? "Complete" : "Ready"}</span>
          </div>
          <span className={`sonic-ear-orb sonic-ear-right ${currentTrial?.ear === "right" ? "is-active" : ""}`}>R</span>
        </div>

        <div className="sonic-status" aria-live="polite">
          <strong>{status}</strong>
          <span>{currentTrial?.kind === "silent" ? "A response-quality check may include no sound." : hearingTestContent.helper}</span>
        </div>

        <div
          className="sonic-progress"
          role="progressbar"
          aria-label="Hearing check progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="sonic-progress-label">{currentStep} of {trials.length} checks</p>

        <div className="sonic-response-actions">
          {!testActive ? (
            <button
              type="button"
              onClick={() => void startTest()}
              disabled={!setupComplete}
              className="premium-button-primary"
            >
              {summary ? "Repeat device check" : "Start device check"}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => settleResponse(true)} disabled={!awaitingResponse} className="sonic-heard-button">
                Yes, I noticed it <kbd>Y</kbd>
              </button>
              <button type="button" onClick={() => settleResponse(false)} disabled={!awaitingResponse} className="sonic-missed-button">
                No, not noticed <kbd>N</kbd>
              </button>
              <button type="button" onClick={stopTest} className="sonic-stop-button">Stop</button>
            </>
          )}
        </div>
      </section>

      {summary ? (
        <section className="sonic-results" aria-labelledby={`result-title-${mode}`}>
          <div className="sonic-result-heading">
            <div>
              <p className="premium-eyebrow">Device-relative observation</p>
              <h3 id={`result-title-${mode}`}>{hearingTestContent.resultTitle}</h3>
            </div>
            <span className={`sonic-reliability sonic-reliability-${summary.reliability}`}>
              Response consistency: {summary.reliabilityLabel}
            </span>
          </div>

          <div className="sonic-result-grid">
            {ears.map((ear) => {
              const detected = ear === "left" ? summary.leftDetected : summary.rightDetected;
              const result = ear === "left" ? summary.leftResult : summary.rightResult;
              return (
                <article key={ear}>
                  <span>{earLabels[ear]}</span>
                  <strong>{detected}/{summary.totalPerEar}</strong>
                  <p>{resultLabel(result)}</p>
                </article>
              );
            })}
            <article className="sonic-next-step">
              <span>Next step</span>
              <p>{summary.recommendation}</p>
            </article>
          </div>

          <div className="sonic-result-notes">
            <h4>How to use this result</h4>
            <ul>
              {hearingTestContent.interpretationGuide.map((line) => <li key={line}>{line}</li>)}
            </ul>
            <p>{hearingTestContent.disclaimer}</p>
          </div>

          <div className="sonic-result-actions">
            <Link href="/#contact" onClick={saveAndContinueToContact} className="premium-button-primary">
              Share summary with Audiosen
            </Link>
            <button type="button" onClick={() => void startTest()} className="premium-button-secondary">
              Repeat in this room
            </button>
            <small>Your result stays in this browser unless you choose “Share summary”.</small>
          </div>
        </section>
      ) : null}
    </div>
  );
}
