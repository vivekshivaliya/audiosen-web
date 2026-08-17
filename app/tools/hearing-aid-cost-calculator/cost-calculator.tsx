"use client";

import { useMemo, useState } from "react";

type CostKey =
  | "devices"
  | "assessment"
  | "fitting"
  | "earmoulds"
  | "accessories"
  | "aftercare"
  | "delivery"
  | "other"
  | "discount";

type CostValues = Record<CostKey, number>;

const initialValues: CostValues = {
  devices: 0,
  assessment: 0,
  fitting: 0,
  earmoulds: 0,
  accessories: 0,
  aftercare: 0,
  delivery: 0,
  other: 0,
  discount: 0,
};

const fields: readonly {
  key: Exclude<CostKey, "discount">;
  label: string;
  help: string;
}[] = [
  {
    key: "devices",
    label: "Quoted device total",
    help: "Use the actual payable amount for all quoted devices, not an unverified web price.",
  },
  {
    key: "assessment",
    label: "Assessment charges",
    help: "Enter only charges stated by the provider for the assessment pathway.",
  },
  {
    key: "fitting",
    label: "Fitting and programming",
    help: "Include this only when it is not already part of the device package.",
  },
  {
    key: "earmoulds",
    label: "Earmoulds or custom parts",
    help: "Use the written amount for impressions, moulds, receivers, shells, or other custom parts.",
  },
  {
    key: "accessories",
    label: "Accessories and consumables",
    help: "For example, a charger, remote microphone, batteries, domes, filters, or cleaning items.",
  },
  {
    key: "aftercare",
    label: "Aftercare or extended support",
    help: "Add only separately priced follow-up, service, or warranty packages.",
  },
  {
    key: "delivery",
    label: "Delivery, travel, or home visit",
    help: "Enter confirmed logistics or visit charges relevant to your location.",
  },
  {
    key: "other",
    label: "Other written charges",
    help: "Use for taxes or a named charge not already included above; avoid counting it twice.",
  },
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function safeAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100_000_000) : 0;
}

export function HearingAidCostCalculator() {
  const [values, setValues] = useState<CostValues>(initialValues);

  const totals = useMemo(() => {
    const subtotal = fields.reduce((sum, field) => sum + values[field.key], 0);
    const discount = Math.min(values.discount, subtotal);
    return {
      subtotal,
      discount,
      payable: Math.max(0, subtotal - discount),
    };
  }, [values]);

  function updateValue(key: CostKey, rawValue: string) {
    setValues((current) => ({ ...current, [key]: safeAmount(rawValue) }));
  }

  function resetCalculator() {
    setValues(initialValues);
  }

  return (
    <div className="premium-shell overflow-hidden p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="font-display text-3xl font-semibold text-slate-900">Enter your written quote amounts</h2>
          <p className="premium-prose mt-3 text-sm">
            Values stay in this browser session and are not submitted to Audiosen. The tool does not
            estimate market prices, judge suitability, or create a binding quote.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="grid gap-2 text-sm font-semibold text-slate-700">
                {field.label}
                <span className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100000000"
                    step="100"
                    value={values[field.key] || ""}
                    onChange={(event) => updateValue(field.key, event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-8 pr-4 text-sm outline-none transition focus:border-sky-600"
                    placeholder="0"
                    aria-describedby={`${field.key}-help`}
                  />
                </span>
                <span id={`${field.key}-help`} className="text-xs font-normal leading-relaxed text-slate-500">
                  {field.help}
                </span>
              </label>
            ))}
          </div>

          <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700 sm:max-w-[calc(50%-0.5rem)]">
            Written discount or credit
            <span className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100000000"
                step="100"
                value={values.discount || ""}
                onChange={(event) => updateValue("discount", event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-8 pr-4 text-sm outline-none transition focus:border-sky-600"
                placeholder="0"
                aria-describedby="discount-help"
              />
            </span>
            <span id="discount-help" className="text-xs font-normal leading-relaxed text-slate-500">
              Subtract only a confirmed rupee amount. Do not convert an “up to” claim without model-level terms.
            </span>
          </label>
        </div>

        <aside className="rounded-[2rem] border border-sky-100 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Planning summary</p>
          <dl className="mt-6 grid gap-4">
            <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
              <dt className="text-sm text-slate-300">Quoted subtotal</dt>
              <dd className="font-semibold">{currency.format(totals.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/15 pb-4">
              <dt className="text-sm text-slate-300">Discount or credit</dt>
              <dd className="font-semibold">− {currency.format(totals.discount)}</dd>
            </div>
            <div className="pt-2" aria-live="polite">
              <dt className="text-sm font-semibold text-cyan-200">Calculated total</dt>
              <dd className="mt-2 font-display text-5xl font-semibold leading-none">
                {currency.format(totals.payable)}
              </dd>
            </div>
          </dl>

          {values.discount > totals.subtotal ? (
            <p className="mt-5 rounded-xl border border-amber-300/40 bg-amber-300/10 p-3 text-xs leading-relaxed text-amber-100">
              The entered discount is greater than the subtotal, so the calculated total is limited to ₹0.
              Recheck the written quote.
            </p>
          ) : null}

          <div className="mt-7 grid gap-3">
            <button type="button" onClick={() => window.print()} className="premium-button-primary justify-center">
              Print This Calculation
            </button>
            <button
              type="button"
              onClick={resetCalculator}
              className="rounded-full border border-white/35 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Clear All Amounts
            </button>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-slate-300">
            The result is arithmetic based only on your inputs. It is not a quotation, invoice,
            recommendation, warranty statement, or confirmation of an offer.
          </p>
        </aside>
      </div>
    </div>
  );
}
