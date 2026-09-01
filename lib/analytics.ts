type AnalyticsValue = string | number | boolean | null | undefined;

type AnalyticsParams = Record<string, AnalyticsValue>;

export const ANALYTICS_EVENT_NAMES = [
  "call_click",
  "whatsapp_click",
  "book_consultation",
  "hearing_aid_view",
  "hearing_aid_compare",
  "request_price",
  "hearing_aid_trial",
  "hearing_aid_finder_start",
  "hearing_aid_finder_complete",
  "home_visit_request",
  "repair_enquiry",
  "speech_consultation",
  "offer_claim",
  "contact_submit",
  "google_directions_click",
  "google_review_click",
  "form_start",
  "hearing_test_start",
  "hearing_test_complete",
  "hearing_test_report_book_click",
  "popup_open",
  "popup_close",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

const analyticsEventNames = new Set<string>(ANALYTICS_EVENT_NAMES);

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return analyticsEventNames.has(value);
}

export type AnalyticsConsentChoice = "granted" | "denied";

export const ANALYTICS_CONSENT_STORAGE_KEY = "audiosen_analytics_consent_v1";
const ANALYTICS_CONSENT_EVENT = "audiosen:analytics-consent-change";

const analyticsParamAllowlist = new Set([
  "channel_priority",
  "cta_location",
  "cta_source",
  "form_name",
  "form_type",
  "lead_source",
  "page_path",
  "page_type",
  "popup_name",
  "brand_slug",
  "product_slug",
  "comparison_count",
  "journey",
  "preferred_channel",
  "result_model",
  "test_variant",
]);

const analyticsExcludedPathPrefixes = ["/admin", "/thank-you"] as const;

export function isAnalyticsExcludedPath(pathname: string): boolean {
  const normalizedPath = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return analyticsExcludedPathPrefixes.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

export function pageHasNoindexDirective(): boolean {
  if (typeof document === "undefined") return true;

  return Array.from(
    document.querySelectorAll<HTMLMetaElement>(
      'meta[name="robots"], meta[name="googlebot"]',
    ),
  ).some((meta) =>
    meta.content
      .toLowerCase()
      .split(",")
      .map((directive) => directive.trim())
      .includes("noindex"),
  );
}

export function analyticsAllowedOnCurrentPage(): boolean {
  if (typeof window === "undefined") return false;
  return !isAnalyticsExcludedPath(window.location.pathname) && !pageHasNoindexDirective();
}

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

export function trackEvent(eventName: AnalyticsEventName, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  if (!analyticsAllowedOnCurrentPage()) return;
  if (readAnalyticsConsent() !== "granted") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", eventName, sanitizeParams(params));
}
