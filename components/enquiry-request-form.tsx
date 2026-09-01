"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TurnstileWidget, type TurnstileConfiguration } from "@/components/turnstile-widget";
import { trackEvent, type AnalyticsEventName } from "@/lib/analytics";
import {
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

type EnquiryType =
  | "appointment"
  | "consultation"
  | "home_visit"
  | "repair"
  | "audiogram"
  | "speech"
  | "callback";

type FormVariant = "consultation" | "home_visit" | "repair" | "audiogram" | "speech";

export type EnquiryServiceOption = {
  value: string;
  label: string;
};

type EnquiryRequestFormProps = {
  type: EnquiryType;
  variant: FormVariant;
  sourcePath: string;
  service: string;
  heading: string;
  intro: string;
  submitLabel: string;
  serviceOptions?: EnquiryServiceOption[];
  speechServiceValues?: readonly string[];
  context?: {
    journey: string;
    brandSlug?: string;
    modelSlug?: string;
  };
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  city: string;
  ageGroup: string;
  service: string;
  message: string;
  appointmentDate: string;
  appointmentTime: string;
  repairBrand: string;
  deviceModel: string;
  problem: string;
  deviceAge: string;
  warrantyStatus: string;
  guardianConsent: boolean;
  consent: boolean;
  website: string;
};

type AttachmentClaim = {
  attachmentId: string;
  claimToken: string;
  verificationGrant: string;
};

type CachedAttachmentClaim = AttachmentClaim & {
  fileKey: string;
  expiresAt: string;
};

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `audiosen-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function safeRedirect(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/thank-you";
}

function enquiryAnalyticsEvent(type: EnquiryType): AnalyticsEventName {
  if (type === "home_visit") return "home_visit_request";
  if (type === "repair") return "repair_enquiry";
  if (type === "speech") return "speech_consultation";
  return "book_consultation";
}

export function EnquiryRequestForm({
  type,
  variant,
  sourcePath,
  service,
  heading,
  intro,
  submitLabel,
  serviceOptions = [],
  speechServiceValues = [],
  context,
}: EnquiryRequestFormProps) {
  const router = useRouter();
  const fieldId = useId();
  const errorRef = useRef<HTMLDivElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const uploadClaimRef = useRef<CachedAttachmentClaim | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    city: "",
    ageGroup: "",
    service,
    message: "",
    appointmentDate: "",
    appointmentTime: "",
    repairBrand: "",
    deviceModel: "",
    problem: "",
    deviceAge: "",
    warrantyStatus: "unknown",
    guardianConsent: false,
    consent: false,
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateFile, setPrivateFile] = useState<File | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [turnstileConfiguration, setTurnstileConfiguration] = useState<TurnstileConfiguration>({
    ready: false,
    configured: false,
  });

  const isUnder18 = form.ageGroup === "child" || form.ageGroup === "teen";
  const showsAppointment = variant !== "repair";

  function presentSubmissionError(
    fieldErrors: Record<string, string[] | undefined> | undefined,
    fallback: string,
  ) {
    const entry = Object.entries(fieldErrors ?? {}).find(([, messages]) => messages?.[0]);
    if (!entry) {
      setError(fallback);
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    const [field, messages] = entry;
    const labels: Record<string, { label: string; control?: string }> = {
      name: { label: "Full name", control: "name" },
      phone: { label: "Phone or WhatsApp", control: "phone" },
      email: { label: "Email", control: "email" },
      city: { label: "City", control: "city" },
      ageGroup: { label: "Patient age group", control: "age" },
      service: { label: "Service", control: "service" },
      message: { label: "Additional details", control: "message" },
      guardianConsent: { label: "Guardian consent" },
      consent: { label: "Privacy consent" },
      turnstileToken: { label: "Bot verification" },
    };
    const target = labels[field];
    setError(`${target?.label ?? "Request"}: ${messages?.[0] ?? fallback}`);
    requestAnimationFrame(() => {
      const element = target?.control
        ? document.getElementById(`${fieldId}-${target.control}`)
        : null;
      if (element instanceof HTMLElement) element.focus();
      else errorRef.current?.focus();
    });
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    idempotencyKeyRef.current = null;
    setError(null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isUnder18 && !form.guardianConsent) {
      setError("A parent or legal guardian must consent for a patient under 18.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    const selectedFileKey = privateFile
      ? `${privateFile.name}:${privateFile.size}:${privateFile.lastModified}`
      : null;
    const cachedUpload = uploadClaimRef.current;
    const hasUsableCachedUpload = Boolean(
      selectedFileKey &&
      cachedUpload?.fileKey === selectedFileKey &&
      Date.parse(cachedUpload.expiresAt) > Date.now() + 5_000,
    );
    if (cachedUpload && !hasUsableCachedUpload) uploadClaimRef.current = null;

    if (!turnstileConfiguration.ready && !hasUsableCachedUpload) {
      setError("Bot verification is still loading. Please try again in a moment.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    if (turnstileConfiguration.configured && !turnstileToken && !hasUsableCachedUpload) {
      setError("Complete the bot verification before sending this request.");
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setLoading(true);
    setError(null);
    const idempotencyKey = idempotencyKeyRef.current ?? createIdempotencyKey();
    idempotencyKeyRef.current = idempotencyKey;
    const submissionType: EnquiryType = speechServiceValues.includes(form.service)
      ? "speech"
      : type;

    let attachmentClaim: AttachmentClaim | null = null;

    if ((variant === "repair" || variant === "audiogram") && privateFile) {
      const fileKey = `${privateFile.name}:${privateFile.size}:${privateFile.lastModified}`;
      const cachedClaim = hasUsableCachedUpload ? uploadClaimRef.current : null;

      if (cachedClaim?.fileKey === fileKey) {
        attachmentClaim = {
          attachmentId: cachedClaim.attachmentId,
          claimToken: cachedClaim.claimToken,
          verificationGrant: cachedClaim.verificationGrant,
        };
      } else {
        const uploadBody = new FormData();
        uploadBody.set("purpose", variant === "repair" ? "device_photo" : "audiogram");
        uploadBody.set("file", privateFile);
        try {
          const uploadResponse = await fetch("/api/uploads/intake", {
            method: "POST",
            headers: turnstileToken
              ? { "X-Audiosen-Turnstile-Token": turnstileToken }
              : undefined,
            body: uploadBody,
          });
          const uploadPayload = (await uploadResponse.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
            upload?: {
              attachmentId?: string;
              claimToken?: string;
              verificationGrant?: string;
              expiresAt?: string;
            };
          };
          if (
            !uploadResponse.ok ||
            !uploadPayload.ok ||
            !uploadPayload.upload?.attachmentId ||
            !uploadPayload.upload.claimToken ||
            !uploadPayload.upload.verificationGrant ||
            !uploadPayload.upload.expiresAt
          ) {
            setError(
              uploadPayload.error ||
                "The private file could not be quarantined. Remove it to continue without the file, or try again.",
            );
            requestAnimationFrame(() => errorRef.current?.focus());
            setTurnstileResetKey((current) => current + 1);
            setLoading(false);
            return;
          }
          attachmentClaim = {
            attachmentId: uploadPayload.upload.attachmentId,
            claimToken: uploadPayload.upload.claimToken,
            verificationGrant: uploadPayload.upload.verificationGrant,
          };
          uploadClaimRef.current = {
            fileKey,
            expiresAt: uploadPayload.upload.expiresAt,
            ...attachmentClaim,
          };
        } catch {
          setError(
            "The private file upload was interrupted. Remove it to continue without the file, or check your connection and try again.",
          );
          requestAnimationFrame(() => errorRef.current?.focus());
          setTurnstileResetKey((current) => current + 1);
          setLoading(false);
          return;
        }
      }
    }

    const details = {
      ...(form.appointmentDate ? { appointmentDate: form.appointmentDate } : {}),
      ...(form.appointmentTime ? { appointmentTime: form.appointmentTime } : {}),
      ...(variant === "home_visit" ? { homeVisit: true } : {}),
      ...(variant === "repair"
        ? {
            repairBrand: form.repairBrand,
            deviceModel: form.deviceModel,
            problem: form.problem,
            deviceAge: form.deviceAge,
            warrantyStatus: form.warrantyStatus,
            ...(attachmentClaim ? { attachments: [attachmentClaim] } : {}),
          }
        : {}),
      ...(variant === "audiogram"
        ? {
            existingAudiogram: Boolean(attachmentClaim),
            ...(attachmentClaim ? { attachments: [attachmentClaim] } : {}),
          }
        : {}),
    };

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          type: submissionType,
          name: form.name,
          phone: form.phone,
          email: form.email,
          city: form.city,
          ageGroup: form.ageGroup,
          service: form.service,
          message: form.message,
          consent: form.consent,
          ...(isUnder18 ? { guardianConsent: form.guardianConsent } : {}),
          website: form.website,
          preferredChannel: "phone_or_whatsapp",
          source: `${variant}_page`,
          sourcePath,
          landingPage: sourcePath,
          context: {
            sourcePath,
            journey: context?.journey ?? variant,
            ...(context?.brandSlug ? { brandSlug: context.brandSlug } : {}),
            ...(context?.modelSlug ? { modelSlug: context.modelSlug } : {}),
            preferences: {
              ageGroup: form.ageGroup,
            },
          },
          details,
          ...(attachmentClaim || !turnstileToken ? {} : { turnstileToken }),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
        redirectTo?: string;
        thankYouUrl?: string;
      };

      if (!response.ok || !payload.ok) {
        presentSubmissionError(
          payload.fieldErrors,
          payload.error || "We could not securely save this request. Please try again.",
        );
        if (
          attachmentClaim &&
          (payload.code === "BOT_VERIFICATION_FAILED" || payload.code === "INVALID_UPLOAD_CLAIM")
        ) {
          uploadClaimRef.current = null;
        }
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      trackEvent(enquiryAnalyticsEvent(submissionType), {
        journey: context?.journey ?? variant,
        brand_slug: context?.brandSlug,
        product_slug: context?.modelSlug,
        page_path: sourcePath,
      });
      router.push(safeRedirect(payload.redirectTo ?? payload.thankYouUrl));
    } catch {
      setError("A network error interrupted the request. Check your connection and try again.");
      setTurnstileResetKey((current) => current + 1);
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-teal-700 focus:ring-4 focus:ring-teal-700/15";

  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] border border-teal-900/10 bg-white p-6 shadow-[0_30px_80px_-52px_rgba(4,45,57,.65)] sm:p-8" noValidate={false}>
      <p className="premium-eyebrow">Secure enquiry</p>
      <h2 className="mt-3 font-display text-4xl font-semibold text-slate-950">{heading}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{intro}</p>

      {error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900 outline-none focus:ring-4 focus:ring-rose-300/40"
        >
          <strong className="block">Please check this request</strong>
          <span className="mt-1 block font-normal">{error}</span>
        </div>
      ) : null}

      <div className="mt-7 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-name`}>
            Full name
            <input id={`${fieldId}-name`} required autoComplete="name" value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-phone`}>
            Phone or WhatsApp
            <input id={`${fieldId}-phone`} type="tel" required autoComplete="tel" inputMode="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-email`}>
            Email for confirmation
            <input id={`${fieldId}-email`} type="email" required autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} className={inputClass} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-city`}>
            City
            <input id={`${fieldId}-city`} required autoComplete="address-level2" value={form.city} onChange={(event) => update("city", event.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-age`}>
            Patient age group
            <select id={`${fieldId}-age`} required value={form.ageGroup} onChange={(event) => update("ageGroup", event.target.value)} className={inputClass}>
              <option value="">Select age group</option>
              <option value="child">Child (0–12)</option>
              <option value="teen">Teen (13–17)</option>
              <option value="adult">Adult (18–59)</option>
              <option value="senior">Senior (60+)</option>
            </select>
          </label>

          {serviceOptions.length ? (
            <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-service`}>
              Service
              <select id={`${fieldId}-service`} required value={form.service} onChange={(event) => update("service", event.target.value)} className={inputClass}>
                {serviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : (
            <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-950">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-teal-700">Selected service</span>
              <strong className="mt-1 block">{form.service}</strong>
            </div>
          )}
        </div>

        {isUnder18 ? (
          <label className="flex min-h-12 items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            <input type="checkbox" required checked={form.guardianConsent} onChange={(event) => update("guardianConsent", event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-amber-700" />
            <span>I am the patient&apos;s parent or legal guardian and consent to Audiosen contacting me about this request.</span>
          </label>
        ) : null}

        {showsAppointment ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-date`}>
              Preferred date (optional)
              <input id={`${fieldId}-date`} type="date" value={form.appointmentDate} onChange={(event) => update("appointmentDate", event.target.value)} className={inputClass} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-time`}>
              Preferred time window (optional)
              <select id={`${fieldId}-time`} value={form.appointmentTime} onChange={(event) => update("appointmentTime", event.target.value)} className={inputClass}>
                <option value="">No preference</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </label>
          </div>
        ) : null}

        {variant === "repair" ? (
          <fieldset className="grid gap-5 rounded-2xl border border-slate-200 p-5">
            <legend className="px-2 font-bold text-slate-900">Device details</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-brand`}>
                Brand
                <input id={`${fieldId}-brand`} required value={form.repairBrand} onChange={(event) => update("repairBrand", event.target.value)} className={inputClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-model`}>
                Model (if known)
                <input id={`${fieldId}-model`} value={form.deviceModel} onChange={(event) => update("deviceModel", event.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-device-age`}>
                Approximate device age (optional)
                <input id={`${fieldId}-device-age`} value={form.deviceAge} onChange={(event) => update("deviceAge", event.target.value)} className={inputClass} placeholder="e.g. 2 years" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-warranty`}>
                Warranty status
                <select id={`${fieldId}-warranty`} value={form.warrantyStatus} onChange={(event) => update("warrantyStatus", event.target.value)} className={inputClass}>
                  <option value="unknown">Not sure</option>
                  <option value="in_warranty">Possibly in warranty</option>
                  <option value="out_of_warranty">Out of warranty</option>
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-problem`}>
              What is happening with the device?
              <textarea id={`${fieldId}-problem`} required rows={4} maxLength={2000} value={form.problem} onChange={(event) => update("problem", event.target.value)} className={inputClass} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-photo`}>
              Device photo (optional)
              <input
                id={`${fieldId}-photo`}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  uploadClaimRef.current = null;
                  idempotencyKeyRef.current = null;
                  setError(null);
                  if (file && file.size > 8 * 1024 * 1024) {
                    event.target.value = "";
                    setPrivateFile(null);
                    setError("The device photo must be 8 MB or smaller.");
                    requestAnimationFrame(() => errorRef.current?.focus());
                    return;
                  }
                  setPrivateFile(file);
                }}
                className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-teal-100 file:px-3 file:py-2 file:font-bold file:text-teal-900`}
              />
              <span className="text-xs font-normal leading-6 text-slate-500">
                JPEG, PNG or WebP, up to 8 MB. The server validates file signatures and places the
                photo in a private malware-quarantine path. Remove the file to submit without it.
              </span>
            </label>
          </fieldset>
        ) : null}

        {variant === "audiogram" ? (
          <fieldset className="grid gap-4 rounded-2xl border border-slate-200 p-5">
            <legend className="px-2 font-bold text-slate-900">Existing audiogram (optional)</legend>
            <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-audiogram`}>
              Private audiogram file
              <input
                id={`${fieldId}-audiogram`}
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  uploadClaimRef.current = null;
                  idempotencyKeyRef.current = null;
                  setError(null);
                  if (file && file.size > 10 * 1024 * 1024) {
                    event.target.value = "";
                    setPrivateFile(null);
                    setError("The audiogram file must be 10 MB or smaller.");
                    requestAnimationFrame(() => errorRef.current?.focus());
                    return;
                  }
                  setPrivateFile(file);
                }}
                className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-teal-100 file:px-3 file:py-2 file:font-bold file:text-teal-900`}
              />
              <span className="text-xs font-normal leading-6 text-slate-500">
                PDF, JPEG or PNG, up to 10 MB. The server checks the file signature and places it in
                a private quarantine path. It is not a diagnosis and is not stored in analytics.
              </span>
            </label>
          </fieldset>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-slate-700" htmlFor={`${fieldId}-message`}>
          Additional details (optional)
          <textarea id={`${fieldId}-message`} rows={4} maxLength={4000} value={form.message} onChange={(event) => update("message", event.target.value)} className={inputClass} placeholder="Share only what the care team needs for this request." />
          <span className="text-xs font-normal text-slate-500">This private narrative is never sent to analytics.</span>
        </label>

        <label className="flex min-h-12 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          <input type="checkbox" required checked={form.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-teal-700" />
          <span>
            I agree to the <Link href="/privacy-policy" target="_blank" className="font-bold text-teal-800 underline underline-offset-2">Privacy Policy</Link> and consent to Audiosen using these details to respond by phone, WhatsApp or email. I can withdraw consent later.
          </span>
        </label>

        <label className="hidden" aria-hidden="true">
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} />
        </label>

        <TurnstileWidget
          onTokenChange={setTurnstileToken}
          resetKey={turnstileResetKey}
          onConfigurationChange={setTurnstileConfiguration}
        />

        <button
          type="submit"
          disabled={loading || !turnstileConfiguration.ready || !turnstileConfiguration.configured}
          className="premium-button-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving your request…" : submitLabel}
        </button>

        <p className="text-xs leading-6 text-slate-500">
          Sending this form does not confirm an appointment, home visit, repair, product, price or
          clinical outcome. Audiosen confirms the next step directly.
        </p>
      </div>
    </form>
  );
}
