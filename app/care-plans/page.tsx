import type { Metadata } from "next";
import Link from "next/link";
import { subscriptionPlans } from "@/lib/content";
import { createPageMetadata } from "@/lib/page-metadata";

const pagePath = "/care-plans";
const serviceByPlanId = {
  three_month: "care-plan-3-months",
  six_month: "care-plan-6-months",
  twelve_month: "care-plan-12-months",
} as const;

export const metadata: Metadata = createPageMetadata({
  title: "Hearing Aid Care Plans | Audiosen",
  description:
    "Compare Audiosen hearing-aid care plans for ongoing consultation, fitting review, cleaning and support. Enquire to confirm suitability and written commercial terms.",
  path: pagePath,
  image: "/images/editorial/hearing-aid-guidance-v2.webp",
  imageAlt: "Hearing-care professional providing ongoing hearing-aid guidance",
});

export default function CarePlansPage() {
  return (
    <main id="main-content">
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_82%_16%,rgba(94,234,212,.30),transparent_25%),linear-gradient(135deg,#062b3a,#075f64_58%,#435d9d)] px-7 py-10 text-white shadow-[0_28px_90px_-42px_rgba(4,45,57,.75)] sm:px-12 sm:py-14">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-200">Ongoing hearing-aid support</p>
          <div className="mt-5 max-w-4xl">
            <h1 className="font-display text-5xl font-semibold leading-[1.03] sm:text-6xl">Care that continues after fitting</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">
              Choose a care-plan conversation for routine review, cleaning and support. The team confirms whether a plan is suitable and provides the applicable written commercial terms before any offline transaction.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">No online payment</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Eligibility confirmed first</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2">Written terms before payment</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="care-plan-options" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="premium-eyebrow">Choose a conversation</p>
          <h2 id="care-plan-options" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">Three ways to plan ongoing care</h2>
          <p className="mt-4 leading-7 text-slate-600">Plan benefits apply only for the confirmed active plan period. Repairs, parts, accessories and major servicing may be charged separately unless written terms say otherwise.</p>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <article key={plan.id} className={`flex h-full flex-col rounded-[1.75rem] border bg-white p-6 shadow-[0_22px_60px_-45px_rgba(4,45,57,.65)] ${plan.id === "six_month" ? "border-teal-400 ring-1 ring-teal-200" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-3xl font-semibold leading-tight text-slate-950">{plan.label}</h3>
                {plan.badge ? <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-teal-900">{plan.badge}</span> : null}
              </div>
              <p className="mt-5 text-4xl font-black tracking-tight text-teal-900">₹{plan.priceInr.toLocaleString("en-IN")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Payable offline only after the team confirms eligibility and written terms.</p>
              <ul className="mt-6 grid gap-3 text-sm leading-6 text-slate-700">
                {plan.coverage.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true" className="font-black text-teal-700">✓</span><span>{item}</span></li>)}
              </ul>
              <Link href={`/book-consultation?service=${serviceByPlanId[plan.id]}`} className="premium-button-primary mt-8 w-full justify-center">
                Ask about this plan
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="premium-eyebrow">Before you enquire</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950">Simple, confirmed and offline</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">An enquiry does not reserve a plan, appointment, price, service availability or device. Audiosen confirms the final scope, exclusions, cancellation and commercial terms in writing before an offline transaction.</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link href="/refund-cancellation" className="premium-button-secondary">Cancellation &amp; commercial terms</Link>
            <Link href="/book-consultation?service=care-plan-6-months" className="premium-button-primary">Ask about a Care Plan</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
