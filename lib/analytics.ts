type AnalyticsValue = string | number | boolean | null | undefined;

type AnalyticsParams = Record<string, AnalyticsValue>;

export type AnalyticsConsentChoice = "granted" | "denied";

export const ANALYTICS_CONSENT_STORAGE_KEY = "audiosen_analytics_consent_v1";
const ANALYTICS_CONSENT_EVENT = "audiosen:analytics-consent-change";

const analyticsParamAllowlist = new Set([
  "channel_priority",
  "cta_source",
  "form_name",
  "form_type",
  "lead_source",
  "page_path",
  "popup_name",
  "preferred_channel",
  "test_variant",
]);

const analyticsEventAliases: Record<string, string> = {
  cta_form_start: "form_start",
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[][];
    __audiosenAnalyticsConsent?: AnalyticsConsentChoice;
  }
}

function sanitizeParams(params: AnalyticsParams): Record<string, string | number | boolean | null> {
  const cleaned: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || !analyticsParamAllowlist.has(key)) continue;

    if (key === "page_path" && typeof value === "string") {
      cleaned[key] = value.split(/[?#]/, 1)[0].slice(0, 160);
      continue;
    }

    cleaned[key] = typeof value === "string" ? value.slice(0, 100) : value;
  }

  return cleaned;
}

export function readAnalyticsConsent(): AnalyticsConsentChoice | null {
  if (typeof window === "undefined") return null;
  if (window.__audiosenAnalyticsConsent) return window.__audiosenAnalyticsConsent;

  try {
    const storedChoice = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    if (storedChoice === "granted" || storedChoice === "denied") {
      window.__audiosenAnalyticsConsent = storedChoice;
      return storedChoice;
    }
  } catch {
    // Analytics remains disabled when storage is unavailable.
  }

  return null;
}

export function saveAnalyticsConsent(choice: AnalyticsConsentChoice): void {
  if (typeof window === "undefined") return;
  window.__audiosenAnalyticsConsent = choice;

  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, choice);
  } catch {
    // The in-memory choice still applies for this page view.
  }

  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
}

export function subscribeToAnalyticsConsent(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(ANALYTICS_CONSENT_EVENT, onChange);
  return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onChange);
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  if (readAnalyticsConsent() !== "granted") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", analyticsEventAliases[eventName] ?? eventName, sanitizeParams(params));
}
