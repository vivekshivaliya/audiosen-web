"use client";

import { FormEvent, useState } from "react";
import { contactContent } from "@/lib/content";

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
  website: string;
};

type WindowWithGtag = Window & {
  gtag?: (...args: unknown[]) => void;
};

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "warning";
    message: string;
  } | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        setError(firstFieldError || payload.error || "Failed to send request.");
        return;
      }

      setNotice({
        tone: payload.warning ? "warning" : "success",
        message: payload.warning || payload.message || contactContent.successLabel,
      });
      const browserWindow = window as WindowWithGtag;
      browserWindow.gtag?.("event", "generate_lead", {
        event_category: "lead",
        event_label: "contact_form",
      });
      setForm(initialState);
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_-22px_rgba(10,92,158,0.45)] sm:p-8"
    >
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Full name
          <input
            type="text"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
            placeholder="Full name"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email address
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
            placeholder="Email address"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Phone number
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
            placeholder="Phone number"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          How can we help you?
          <textarea
            required
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            rows={4}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-500"
            placeholder="Tell us if you need a hearing test, hearing aid service, product guidance, tinnitus support, fitting, or repair help."
          />
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
          className="mt-2 rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Sending your hearing care request..." : contactContent.submitLabel}
        </button>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p
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
          Secure form | {contactContent.lockline}
        </p>
      </div>
    </form>
  );
}
