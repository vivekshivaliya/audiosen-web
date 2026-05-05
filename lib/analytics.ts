type AnalyticsValue = string | number | boolean | null | undefined;

type AnalyticsParams = Record<string, AnalyticsValue>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function sanitizeParams(params: AnalyticsParams): Record<string, string | number | boolean | null> {
  const cleaned: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    cleaned[key] = value;
  }

  return cleaned;
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", eventName, sanitizeParams(params));
}

