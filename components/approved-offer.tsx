import Link from "next/link";
import { ContextualEnquiryForm } from "@/components/catalog/contextual-enquiry-form";
import type { PublicOffer } from "@/lib/offers/public";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

export function ApprovedOffer({ offer, compact = false }: { offer: PublicOffer; compact?: boolean }) {
  const sourcePath = offer.landingPage;
  const isDiscountCampaign = offer.kind === "campaign" && offer.maximumDiscountPct !== null;
  const publicKindLabel = offer.kind === "campaign"
    ? "campaign"
    : offer.kind === "care_plan"
      ? "care plan"
      : `${offer.kind} program`;
  return (
    <article className={`overflow-hidden rounded-[2rem] border p-7 shadow-[0_24px_80px_rgba(9,60,69,.10)] sm:p-10 ${
      isDiscountCampaign
        ? "border-amber-200 bg-[radial-gradient(circle_at_90%_8%,rgba(251,191,36,.3),transparent_28%),linear-gradient(135deg,#fffdf5,#ecf9f7)]"
        : "border-teal-200 bg-[linear-gradient(135deg,#f8fffd,#eef8f7)]"
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="premium-eyebrow">Owner-approved, date-bound {publicKindLabel}</p>
        {isDiscountCampaign ? (
          <span className="rounded-full bg-teal-950 px-4 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-amber-200">
            Eligible for Up to {offer.maximumDiscountPct}% Off
          </span>
        ) : null}
      </div>
      {compact ? (
        <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
          {offer.title}
        </h2>
      ) : (
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl">
          {offer.title}
        </h1>
      )}
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{offer.summary}</p>
      {isDiscountCampaign ? (
        <section aria-label="Offer eligibility process" className="mt-5 grid max-w-4xl gap-3 sm:grid-cols-3">
          {[
            ["1", "Choose a mapped model", "Only the hearing aids listed below can be considered."],
            ["2", "Check eligibility", "The team confirms the specific device and applicable written terms."],
            ["3", "Receive it in writing", "The exact saving is confirmed before you decide—no reservation is created."],
          ].map(([step, title, detail]) => (
            <div key={step} className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-950">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 text-xs font-black">{step}</span>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-amber-950/80">{detail}</p>
            </div>
          ))}
        </section>
      ) : null}

      <dl className={`mt-7 grid gap-3 rounded-2xl border border-teal-200 bg-white p-5 text-sm ${isDiscountCampaign ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {isDiscountCampaign ? (
          <div><dt className="font-bold text-slate-950">Maximum saving</dt><dd className="mt-1 text-slate-600">Up to {offer.maximumDiscountPct}% on mapped eligible devices only</dd></div>
        ) : null}
        <div><dt className="font-bold text-slate-950">Starts</dt><dd className="mt-1 text-slate-600">{formatDate(offer.startsAt)}</dd></div>
        <div><dt className="font-bold text-slate-950">Ends</dt><dd className="mt-1 text-slate-600">{formatDate(offer.endsAt)}</dd></div>
      </dl>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        {offer.products.length ? (
          <section className="rounded-2xl bg-teal-950 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-200">Exact mapped devices</p>
            <h3 className="mt-2 text-xl font-bold">Eligible hearing-aid models</h3>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-teal-50/90">
              {offer.products.map((product) => (
                <li key={`${product.brandSlug}~${product.modelSlug}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Link className="underline decoration-teal-400 underline-offset-4" href={`/hearing-aids/${product.brandSlug}/${product.modelSlug}`}>
                    {product.brandName} {product.modelName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {offer.services.length ? (
          <section className="rounded-2xl bg-teal-950 p-6 text-white">
            <h3 className="text-xl font-bold">Eligible services</h3>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-teal-50/90">
              {offer.services.map((service) => <li key={service.slug}>{service.name}</li>)}
            </ul>
          </section>
        ) : null}
      </div>

      <details className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer font-bold text-slate-950">Full written {publicKindLabel} terms</summary>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{offer.terms}</p>
      </details>

      {compact ? (
        <div className="mt-7">
          <Link className="premium-button-primary" href={offer.landingPage}>Review eligibility and enquire</Link>
        </div>
      ) : (
        <div className="mt-8">
          <ContextualEnquiryForm
            type={offer.kind === "trial" ? "trial" : "offer"}
            service={offer.title}
            sourcePath={sourcePath}
            context={{ journey: `commercial_${offer.kind}`, offerSlug: offer.slug }}
            heading={`Ask about this approved ${publicKindLabel}`}
            intro={isDiscountCampaign
              ? "Send an enquiry for written confirmation of the exact eligible item, actual saving, current availability and applicable terms. Submitting does not reserve a device or appointment."
              : "Send an enquiry for written confirmation of the exact eligible item or service, pricing, deposit, warranty, trial applicability and current availability. Submitting does not reserve a device or appointment."}
            submitLabel="Request written terms"
          />
        </div>
      )}
    </article>
  );
}
