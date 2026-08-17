"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { contactContent } from "@/lib/content";
import { trackEvent } from "@/lib/analytics";
import {
  clearHearingTestSummary,
  formatHearingTestSummaryForContact,
  HEARING_TEST_SUMMARY_EVENT,
  readHearingTestSummary,
} from "@/lib/hearing-test-storage";

type FormState = {
  name: string;
  email: string;
  phone: string;
  city: string;
  serviceNeeded: string;
  message: string;
  consent: boolean;
  website: string;
};

type CampaignAttribution = {
  landingPage: string;
  sourcePage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  msclkid: string;
  fbclid: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  city: "",
  serviceNeeded: "",
  message: "",
  consent: false,
  website: "",
};

const emptyAttribution: CampaignAttribution = {
  landingPage: "",
  sourcePage: "",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmTerm: "",
  utmContent: "",
  gclid: "",
  gbraid: "",
  wbraid: "",
  msclkid: "",
  fbclid: "",
};

const ATTRIBUTION_STORAGE_KEY = "audiosen_lead_attribution_v1";

type ContactFormProps = {
  surface?: "shell" | "plain";
};

type PrefillSource = "hearing-report";

function limitedParam(params: URLSearchParams, name: string, maxLength = 300): string {
  return (params.get(name) || "").trim().slice(0, maxLength);
}

function currentAttribution(): CampaignAttribution {
  if (typeof window === "undefined") return emptyAttribution;

  const params = new URLSearchParams(window.location.search);
  const pagePath = window.location.pathname.slice(0, 500) || "/";

  return {
    landingPage: pagePath,
    sourcePage: pagePath,
    utmSource: limitedParam(params, "utm_source", 200),
    utmMedium: limitedParam(params, "utm_medium", 200),
    utmCampaign: limitedParam(params, "utm_campaign", 200),
    utmTerm: limitedParam(params, "utm_term", 200),
    utmContent: limitedParam(params, "utm_content", 200),
    gclid: limitedParam(params, "gclid"),
    gbraid: limitedParam(params, "gbraid"),
    wbraid: limitedParam(params, "wbraid"),
    msclkid: limitedParam(params, "msclkid"),
    fbclid: limitedParam(params, "fbclid"),
  };
}

function isCampaignAttribution(value: unknown): value is CampaignAttribution {
  if (!value || typeof value !== "object") return false;

  return Object.keys(emptyAttribution).every(
    (key) => typeof (value as Record<string, unknown>)[key] === "string",
  );
}

function hydrateAttribution(): CampaignAttribution {
  const current = currentAttribution();

  try {
    const stored = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (isCampaignAttribution(parsed)) {
        return { ...parsed, sourcePage: current.sourcePage };
      }
    }

    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Attribution still works for the current page when storage is unavailable.
  }

  return current;
}

export function ContactForm({ surface = "shell" }: ContactFormProps) {
  const hasTrackedStartRef = useRef(false);
  const [form, setForm] = useState<FormState>(initialState);
  const [attribution, setAttribution] = useState<CampaignAttribution>(emptyAttribution);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefillSource, setPrefillSource] = useState<PrefillSource | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "warning";
    message: string;
  } | null>(null);

  useEffect(() => {
    setAttribution(hydrateAttribution());
  }, []);

  useEffect(() => {
    const hydratePrefills = () => {
      const summary = readHearingTestSummary();

      if (!summary) {
        setPrefillSource(null);
        return;
      }

      setForm((current) => {
        if (current.message.trim().length > 0) return current;

        return {
          ...current,
          serviceNeeded: current.serviceNeeded || "Discuss an online hearing check",
          message: formatHearingTestSummaryForContact(summary),
        };
      });
      setPrefillSource("hearing-report");
      setShowDetails(true);
    };

    hydratePrefills();
    window.addEventListener(HEARING_TEST_SUMMARY_EVENT, hydratePrefills);

    return () => {
      window.removeEventListener(HEARING_TEST_SUMMARY_EVENT, hydratePrefills);
    };
  }, []);

  function clearPrefilledMessage() {
    clearHearingTestSummary();
    setPrefillSource(null);
    setForm((current) => ({ ...current, message: "" }));
  }

  function trackFormStart() {
    if (hasTrackedStartRef.current) return;
    hasTrackedStartRef.current = true;
    trackEvent("form_start", {
      form_name: "hearing_care_callback",
      form_type: "lead_capture",
      page_path: typeof window !== "undefined" ? window.location.pathname : "unknown",
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const currentCampaign =
        attribution.landingPage.length > 0 ? attribution : hydrateAttribution();
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...currentCampaign,
          language: "",
          preferredChannel: "Phone or WhatsApp",
          preferredCallbackTime: "",
          leadSource: "website_contact_form",
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        warning?: string;
        message?: string;
        fieldErrors?: Record<string, string[]>;
      };

      if (!response.ok || !payload.ok) {
        const firstFieldError = payload.fieldErrors
          ? Object.values(payload.fieldErrors).flat()[0]
          : null;
        setError(firstFieldError || payload.error || "Failed to save your request.");
        return;
      }

      setNotice({
        tone: payload.warning ? "warning" : "success",
        message: payload.warning || payload.message || contactContent.successLabel,
      });
      trackEvent("generate_lead", {
        form_name: "hearing_care_callback",
        form_type: "lead_capture",
        lead_source: "website_contact_form",
        page_path: typeof window !== "undefined" ? window.location.pathname : "unknown",
      });
      clearHearingTestSummary();
      setPrefillSource(null);
      setShowDetails(false);
      setForm(initialState);
      hasTrackedStartRef.current = false;
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocusCapture={trackFormStart}
      className={surface === "shell" ? "premium-shell p-6 sm:p-8" : ""}
    >
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Full name
            <input
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
              placeholder="Your full name"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone or WhatsApp
            <input
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
              placeholder="e.g. +91 98765 43210"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            City
            <input
              type="text"
              required
              autoComplete="address-level2"
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
              placeholder="Your city"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            What do you need help with?
            <select
              required
              value={form.serviceNeeded}
              onChange={(event) => setForm({ ...form, serviceNeeded: event.target.value })}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-sky-500"
            >
              <option value="" disabled>
                Select one
              </option>
              <option>Choose a hearing aid</option>
              <option>Book a hearing assessment</option>
              <option>Discuss an online hearing check</option>
              <option>Hearing aid fitting or tuning</option>
              <option>Hearing aid repair or service</option>
              <option>ENT referral guidance</option>
              <option>Something else</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((current) => !current)}
          className="w-fit text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4"
          aria-expanded={showDetails}
        >
          {showDetails ? "Hide additional details" : "+ Add details for our team (optional)"}
        </button>

        {showDetails ? (
          <div className="grid gap-2">
            {prefillSource ? (
              <span className="inline-flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                Your hearing-check summary was added for you.
                <button
                  type="button"
                  onClick={clearPrefilledMessage}
                  className="ml-3 rounded-full border border-emerald-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-800 transition hover:bg-emerald-100"
                >
                  Clear
                </button>
              </span>
            ) : null}
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email for a confirmation (optional)
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
                placeholder="you@example.com"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Additional details (optional)
              <textarea
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                rows={3}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
                placeholder="Anything useful for our team to know"
              />
            </label>
          </div>
        ) : null}

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            required
            checked={form.consent}
            onChange={(event) => setForm({ ...form, consent: event.target.checked })}
            className="mt-1 h-4 w-4 shrink-0 accent-sky-600"
          />
          <span>
            I agree to the{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-700 underline underline-offset-2"
            >
              Privacy Policy
            </a>{" "}
            and consent to Audiosen contacting me by phone or WhatsApp about this request.
          </span>
        </label>

        <label className="hidden" aria-hidden="true">
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="premium-button-primary mt-2 disabled:cursor-not-allowed disabled:border-slate-400 disabled:bg-slate-400"
        >
          {loading ? "Saving your request..." : "Request a hearing-care callback"}
        </button>

        {error ? (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p
            role="status"
            className={
              notice.tone === "warning"
                ? "rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"
                : "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            }
          >
            {notice.message}
          </p>
        ) : null}

        <p className="text-center text-xs text-slate-500">
          Your details are used only to respond to this request. {contactContent.lockline}
        </p>
      </div>
    </form>
  );
}
