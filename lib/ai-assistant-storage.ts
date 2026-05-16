const AI_CONTACT_PREFILL_KEY = "audiosen_ai_contact_prefill_v1";
export const AI_CONTACT_PREFILL_EVENT = "audiosen-ai-contact-prefill-updated";

export type AiContactPrefill = {
  message: string;
  createdAt: string;
};

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function saveAiContactPrefill(message: string): void {
  if (!hasWindow()) return;

  const payload: AiContactPrefill = {
    message,
    createdAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(AI_CONTACT_PREFILL_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(AI_CONTACT_PREFILL_EVENT));
}

export function readAiContactPrefill(): AiContactPrefill | null {
  if (!hasWindow()) return null;

  const raw = window.sessionStorage.getItem(AI_CONTACT_PREFILL_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AiContactPrefill;
    if (!parsed.message || typeof parsed.message !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAiContactPrefill(): void {
  if (!hasWindow()) return;
  window.sessionStorage.removeItem(AI_CONTACT_PREFILL_KEY);
  window.dispatchEvent(new Event(AI_CONTACT_PREFILL_EVENT));
}
