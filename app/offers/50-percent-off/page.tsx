import type { Metadata } from "next";
import Link from "next/link";
import { callHref, clinicContact, whatsappHref } from "@/lib/content";
import { publicOfferTerms } from "@/lib/trust-content";

const pageUrl = "https://audiosen.com/offers/50-percent-off";

export const metadata: Metadata = {
  title: "Hearing Aid Savings & Written Quote Terms | Audiosen",
  description:
    "Request a written hearing-aid quote from Audiosen with the model, MRP basis, payable price, stock, fitting, warranty, validity, and exclusions.",
  alternates: { canonical: "/offers/50-percent-off" },
  openGraph: {
    title: "Hearing Aid Savings & Written Quote Terms | Audiosen",
    description:
      "Request transparent model-level terms before relying on a hearing-aid discount claim.",
    url: pageUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/editorial/hearing-aid-guidance-v2.webp",
        alt: "A hearing-care professional explaining hearing-aid choices and written terms",
      },
    ],
  },
};

const disclosureRows = [
  {
    label: "Eligible device",
    value:
      "The full manufacturer and model must be named in the written quote. Audiosen is not currently publishing a universal eligible-SKU list online.",
  },
  {
    label: "MRP and campaign price",
    value:
      "The quote must show the model-specific MRP basis and actual payable campaign price. A banner or percentage by itself is not a price commitment.",
  },
  {
    label: "Discount percentage",
    value:
      "No universal percentage is published without an approved model-level price record. The named model and payable price in the written quote control.",
  },
  {
    label: "Campaign dates and quote validity",
    value:
      "Start date, end date, or quote expiry must be stated in the written document supplied to you. No date is invented on this page.",
  },
  {
    label: "Stock and location",
    value:
      "Availability must be reconfirmed before payment and can depend on model, configuration, colour, location, and supply.",
  },
  {
    label: "Fitting and aftercare",
    value:
      "The quote should identify assessment, fitting, programming, follow-up, accessories, delivery, home visits, and aftercare that are included or charged separately.",
  },
  {
    label: "Warranty, cancellation, and refund",
    value:
      "Ask for the manufacturer warranty and any service, cancellation, return, custom-product, or refund conditions that apply before payment.",
  },
];

const faqs = [
  {
    question: "Is a percentage discount guaranteed on every Audiosen hearing aid?",
    answer:
      "No universal percentage entitlement is stated. Savings, if available, apply only to the specifically quoted device and conditions. Your written model-level quote is the authoritative commercial record.",
  },
  {
    question: "Why is there no model price table on this page?",
    answer:
      "Audiosen has not supplied an approved, current SKU-level schedule containing the exact MRP, campaign price, stock, dates, fitting, warranty, and approval record for public display. The page will not fabricate those facts.",
  },
  {
    question: "What should I receive before paying?",
    answer:
      "Request the exact model, quantity, MRP basis, payable price, taxes, stock, included services, accessories, fitting, warranty, campaign or quote validity, delivery, and cancellation or refund terms in writing.",
  },
  {
    question: "Does a discount establish that a hearing aid is suitable?",
    answer:
      "No. A commercial offer does not replace appropriate assessment, device selection, programming, fitting, or professional guidance.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "Audiosen hearing-aid savings and written quote terms",
      description:
        "Transparent conditions for evaluating Audiosen hearing-aid savings and written quotes.",
      inLanguage: "en-IN",
      publisher: { "@id": "https://audiosen.com/#organization" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://audiosen.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Offers",
          item: "https://audiosen.com/offers/50-percent-off",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Hearing-aid savings terms",
          item: pageUrl,
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

export default function FiftyPercentOfferPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-sky-800">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Offers</span>
          <span aria-hidden="true"> / </span>
          <span>Hearing-aid savings terms</span>
        </nav>

        <div className="premium-shell overflow-hidden px-6 py-10 sm:px-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-center">
            <div>
              <p className="premium-eyebrow">Transparent offer disclosure</p>
              <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
                Hearing Aid Savings: Confirm Your Written Terms
              </h1>
              <p className="premium-prose mt-5 max-w-3xl text-lg">{publicOfferTerms.publicClaim}</p>
              <p className="premium-prose mt-3 max-w-3xl">
                Exact eligibility, price, stock, dates, included fitting, warranty, and aftercare
                must be confirmed for the named device before you rely on the promotion.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="premium-button-primary"
                >
                  Request Terms on WhatsApp
                </a>
                <Link href="/contact" className="premium-button-secondary">
                  Request a Written Quote
                </Link>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-rose-200 bg-gradient-to-br from-rose-50 via-amber-50 to-white p-7 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-800">Why no percentage is shown</p>
              <p className="mt-3 font-display text-5xl font-semibold text-slate-900">Written model terms come first</p>
              <p className="premium-prose mt-4 text-sm">
                A percentage will be published only when the exact model, MRP basis, payable price,
                approval, dates, stock, and conditions are recorded. Until then, rely on the complete
                written quote supplied for the named device.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <p className="premium-eyebrow">Before payment</p>
        <h2 className="mt-4 max-w-4xl font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
          Seven facts your quote should confirm
        </h2>
        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 shadow-sm">
          <dl className="divide-y divide-slate-200">
            {disclosureRows.map((row) => (
              <div key={row.label} className="grid gap-2 px-6 py-5 md:grid-cols-[15rem_1fr] md:gap-6">
                <dt className="font-semibold text-slate-900">{row.label}</dt>
                <dd className="text-sm leading-relaxed text-slate-600">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="premium-section px-6 py-10 sm:px-8">
            <p className="premium-eyebrow">What the current record proves</p>
            <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              No unverified model-level terms are published
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <article className="premium-card p-6">
                <h3 className="text-xl font-semibold text-slate-900">Eligible SKUs</h3>
                <p className="premium-prose mt-3 text-sm">
                  {publicOfferTerms.eligibleProducts.length === 0
                    ? "No approved public SKU list is currently recorded. Eligibility must appear in the written quote."
                    : `${publicOfferTerms.eligibleProducts.length} approved products are recorded.`}
                </p>
              </article>
              <article className="premium-card p-6">
                <h3 className="text-xl font-semibold text-slate-900">Campaign dates</h3>
                <p className="premium-prose mt-3 text-sm">
                  No start or end date is published without an approved record. Use the validity
                  period on the written quote.
                </p>
              </article>
              <article className="premium-card p-6">
                <h3 className="text-xl font-semibold text-slate-900">Approval status</h3>
                <p className="premium-prose mt-3 text-sm">
                  Model-specific online publication is awaiting business confirmation. A sales
                  conversation alone does not replace written terms.
                </p>
              </article>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
              {publicOfferTerms.quoteValidityNote}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="premium-eyebrow">Offer questions</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Read this before relying on a discount
          </h2>
        </div>
        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="premium-card p-6">
              <h3 className="text-xl font-semibold text-slate-900">{faq.question}</h3>
              <p className="premium-prose mt-3">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="premium-shell grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="font-display text-4xl font-semibold text-slate-900">Ask for a complete quote</h2>
            <p className="premium-prose mt-3 max-w-3xl">
              Audiosen serves enquiries across India and confirms location-based availability. The
              verified physical clinic is in Dehradun. Call or message before visiting or paying.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={callHref} className="premium-button-primary">
              Call {clinicContact.primaryCallDisplay}
            </a>
            <Link href="/refund-cancellation" className="premium-button-secondary">
              Refund & Cancellation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
