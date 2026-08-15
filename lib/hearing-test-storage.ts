import type { HearingTestSummary } from "@/lib/types";

const HEARING_TEST_SUMMARY_KEY = "audiosen_hearing_test_summary_v2";
export const HEARING_TEST_SUMMARY_EVENT = "audiosen-hearing-summary-updated";

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function saveHearingTestSummary(summary: HearingTestSummary): void {
  if (!hasWindow()) return;
  window.sessionStorage.setItem(HEARING_TEST_SUMMARY_KEY, JSON.stringify(summary));
  window.dispatchEvent(new Event(HEARING_TEST_SUMMARY_EVENT));
}

export function readHearingTestSummary(): HearingTestSummary | null {
  if (!hasWindow()) return null;

  const raw = window.sessionStorage.getItem(HEARING_TEST_SUMMARY_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as HearingTestSummary;
  } catch {
    return null;
  }
}

export function clearHearingTestSummary(): void {
  if (!hasWindow()) return;
  window.sessionStorage.removeItem(HEARING_TEST_SUMMARY_KEY);
  window.dispatchEvent(new Event(HEARING_TEST_SUMMARY_EVENT));
}

export function formatHearingTestSummaryForContact(summary: HearingTestSummary): string {
  const date = new Date(summary.completedAt);
  const dateLabel = Number.isNaN(date.getTime())
    ? summary.completedAt
    : date.toLocaleString("en-IN", { hour12: true });

  return [
    "Hello Audiosen team,",
    "",
    "I completed your online hearing screening and I would like to book a consultation.",
    "",
    `Completed: ${dateLabel}`,
    `Left ear device check: ${summary.leftDetected}/${summary.totalPerEar} tones noticed`,
    `Right ear device check: ${summary.rightDetected}/${summary.totalPerEar} tones noticed`,
    `Response consistency: ${summary.reliabilityLabel}`,
    "This was an uncalibrated browser screening, not a clinical audiogram or diagnosis.",
    "",
    "Key notes:",
    ...summary.notes.slice(0, 3).map((note) => `- ${note}`),
  ].join("\n");
}
