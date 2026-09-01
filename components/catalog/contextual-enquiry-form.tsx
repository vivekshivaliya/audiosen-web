"use client";

import { FormEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TurnstileWidget, type TurnstileConfiguration } from "@/components/turnstile-widget";
import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";

export type EnquiryType =
  | "contact"
  | "appointment"
  | "consultation"
  | "product_enquiry"
  | "request_price"
  | "offer"
  | "home_visit"
  | "repair"
  | "speech"
  | "finder"
  | "hearing_aid_finder"
  | "trial"
  | "callback"
  | "audiogram"
  | "whatsapp_lead";

type JsonPrimitive = string | number | boolean | null;
export type EnquiryContextValue =
  | JsonPrimitive
  | readonly JsonPrimitive[]
  | { readonly [key: string]: JsonPrimitive | readonly JsonPrimitive[] };

export type ContextualEnquiryContext = {
  journey: string;
  brandSlug?: string;
  modelSlug?: string;
  compareSlugs?: readonly string[];
  preferences?: { readonly [key: string]: JsonPrimitive | readonly JsonPrimitive[] };
  [key: string]: EnquiryContextValue | undefined;
};

type ContextualEnquiryFormProps = {
  type: EnquiryType;
  service: string;
  sourcePath: string;
  context: ContextualEnquiryContext;
  heading?: string;
  intro?: string;
  submitLabel?: string;
  initialCity?: string;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  city: string;
  message: string;
  consent: boolean;
  website: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  city: "",
  message: "",
  consent: false,
  website: "",
};

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `audiosen-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function safeThankYouUrl(value: unknown): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/thank-you";
}

function enquiryAnalyticsEvent(
  type: EnquiryType,
  journey: string,
): AnalyticsEventName {
  if (type === "request_price") return "request_price";
  if (type === "trial") return "hearing_aid_trial";
  if (type === "finder" || type === "hearing_aid_finder") {
    return "contact_submit";
  }
  if (type === "home_visit") return "home_visit_request";
  if (type === "repair") return "repair_enquiry";
  if (type === "speech") return "speech_consultation";
  if (type === "offer") return "offer_claim";
  if (journey === "comparison") return "contact_submit";
  return "book_consultation";
}

export function ContextualEnquiryForm({
  type,
  service,
  sourcePath,
  context,
  heading = "Ask for current information",
  intro = "Share a safe callback number and your city. Audiosen can respond with the next available guidance step.",
  submitLabel = "Send enquiry",
  initialCity = "",
}: ContextualEnquiryFormProps) {
  const router = useRouter();
  const idPrefix = useId();
  const idempotencyKeyRef = useRef<string | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    ...initialState,
    city: initialCity.trim().slice(0, 80),
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [turnstileConfiguration, setTurnstileConfiguration] = useState<TurnstileConfiguration>({
    ready: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    configured: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  });
  const requiresGuardianConsent = context.preferences?.agePath === "child";

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    idempotencyKeyRef.current = null;
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (requiresGuardianConsent && !guardianConsent) {
      setError("A parent or legal guardian must consent for a patient under 18.");
      return;
    }

    if (!turnstileConfiguration.ready) {
      setError("Bot verification is still loading. Please try again in a moment.");
      return;
    }

    if (turnstileConfiguration.configured && !turnstileToken) {
      setError("Complete the bot verification before sending this enquiry.");
      return;
    }

    setLoading(true);
    setError(null);

    const idempotencyKey = idempotencyKeyRef.current ?? createIdempotencyKey();
    idempotencyKeyRef.current = idempotencyKey;

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          ...form,
          type,
          service,
          serviceNeeded: service,
          source: `catalog_${context.journey}`,
          leadSource: `catalog_${context.journey}`,
          sourcePath,
          context: { ...context, sourcePath },
          ...(requiresGuardianConsent ? { guardianConsent } : {}),
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
        referenceId?: string;
        thankYouUrl?: string;
        redirectTo?: string;
      };

      if (!response.ok || !payload.ok) {
        const fieldError = Object.values(payload.fieldErrors ?? {}).flat().find(Boolean);
        setError(fieldError || payload.error || "We could not save this enquiry. Please try again.");
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      trackEvent(enquiryAnalyticsEvent(type, context.journey), {
        journey: context.journey,
        brand_slug: context.brandSlug,
        product_slug: context.modelSlug,
        comparison_count: context.compareSlugs?.length,
        page_path: sourcePath,
      });
      router.push(safeThankYouUrl(payload.redirectTo ?? payload.thankYouUrl));
    } catch {
      setError("A network error interrupted the request. Check your connection and try again.");
      setTurnstileResetKey((current) => current + 1);
    } finally {
      setLoading(false);
    }
  }

  const descriptionId = `${idPrefix}-description`;
  const errorId = `${idPrefix}-error`;

  return (
    <form
      id="catalog-enquiry"
      onSubmit={onSubmit}
      aria-describedby={`${descriptionId}${error ? ` ${errorId}` : ""}`}
      className="premium-shell scroll-mt-32 p-6 sm:p-8"
    >
      <p className="premium-eyebrow">Context-aware enquiry</p>
      <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">{heading}</h2>
      <p id={descriptionId} className="premium-prose mt-3 max-w-3xl">
        {intro}
      </p>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Full name
            <input
              type="text"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Phone or WhatsApp
            <input
              type="tel"
              required
              minLength={7}
              maxLength={30}
              autoComplete="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => updateForm("phone", event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            City
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              autoComplete="address-level2"
              value={form.city}
              onChange={(event) => updateForm("city", event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email for confirmation
            <input
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Questions or preferences (optional)
          <textarea
            rows={4}
            maxLength={4000}
            value={form.message}
            onChange={(event) => updateForm("message", event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
            placeholder="For example: preferred style, phone type, daily listening situations, or a model you want to discuss."
          />
        </label>

        {requiresGuardianConsent ? (
          <label className="flex min-h-12 items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            <input
              type="checkbox"
              required
              checked={guardianConsent}
              onChange={(event) => {
                setGuardianConsent(event.target.checked);
                idempotencyKeyRef.current = null;
                setError(null);
              }}
              className="mt-1 h-5 w-5 shrink-0 accent-amber-700"
            />
            <span>
              I am the patient&apos;s parent or legal guardian and consent to Audiosen contacting me
              about this request.
            </span>
          </label>
        ) : null}

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700">
          <input
            type="checkbox"
            required
            checked={form.consent}
            onChange={(event) => updateForm("consent", event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
          />
          <span>
            I agree to the{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-teal-800 underline underline-offset-2"
            >
              Privacy Policy
            </a>{" "}
            and consent to Audiosen contacting me about this request by phone or WhatsApp.
          </span>
        </label>

        <label className="hidden" aria-hidden="true">
          Website
          <input
            type="text"
            maxLength={200}
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => updateForm("website", event.target.value)}
          />
        </label>

        <TurnstileWidget
          onTokenChange={setTurnstileToken}
          resetKey={turnstileResetKey}
          onConfigurationChange={setTurnstileConfiguration}
        />

        <button
          type="submit"
          disabled={loading || !turnstileConfiguration.ready || !turnstileConfiguration.configured}
          className="premium-button-primary mt-1 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving enquiry…" : submitLabel}
        </button>

        {error ? (
          <p id={errorId} role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <p className="text-xs leading-relaxed text-slate-500">
          Please do not submit medical records or highly sensitive health information here. An
          enquiry does not reserve a device, price, appointment, or trial.
        </p>
      </div>
    </form>
  );
}
