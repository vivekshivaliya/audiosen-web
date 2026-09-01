import type { Metadata } from "next";
import Link from "next/link";
import { HearingAidCostCalculator } from "./cost-calculator";
import { whatsappHref } from "@/lib/content";
import { StructuredData } from "@/lib/structured-data";

const pageUrl = "https://audiosen.com/tools/hearing-aid-cost-calculator";

export const metadata: Metadata = {
  title: "Hearing Aid Cost Calculator | Quote Planner | Audiosen",
  description:
    "Add device, assessment, fitting, accessories, aftercare, delivery, and discount amounts from a written quote to compare hearing-aid total cost.",
  alternates: { canonical: "/tools/hearing-aid-cost-calculator" },
  openGraph: {
    title: "Hearing Aid Cost Calculator | Quote Planner | Audiosen",
    description:
      "Add device, assessment, fitting, accessories, aftercare, delivery, and discount amounts from a written quote to compare hearing-aid total cost.",
    url: pageUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/editorial/hearing-aid-guidance-v2.webp",
        alt: "An Indian family reviewing hearing-aid choices and costs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hearing Aid Cost Calculator | Quote Planner | Audiosen",
    description:
      "Add device, assessment, fitting, accessories, aftercare, delivery, and discount amounts from a written quote to compare hearing-aid total cost.",
    images: ["/images/editorial/hearing-aid-guidance-v2.webp"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${pageUrl}#application`,
      name: "Audiosen Hearing Aid Cost Calculator",
      url: pageUrl,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any modern web browser",
      browserRequirements: "JavaScript enabled",
      description:
        "A browser-based arithmetic tool for adding user-supplied hearing-aid quote amounts.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
      provider: { "@id": "https://audiosen.com/#organization" },
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
          name: "Hearing Aid Cost Calculator",
          item: pageUrl,
        },
      ],
    },
  ],
};

const checklist = [
  "Exact manufacturer, model, technology level, side, and quantity",
  "MRP basis, actual payable device price, taxes, and quote validity",
  "Assessment, fitting, programming, verification, and follow-up charges",
  "Earmoulds, receivers, charger, batteries, accessories, and consumables",
  "Warranty period, exclusions, repair route, and optional extended coverage",
  "Delivery, travel, home visit, cancellation, refund, and custom-product terms",
];

export default function HearingAidCostCalculatorPage() {
  return (
    <main>
      <StructuredData data={structuredData} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-sky-800">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Tools</span>
          <span aria-hidden="true"> / </span>
          <span>Hearing Aid Cost Calculator</span>
        </nav>

        <div className="premium-shell px-6 py-10 sm:px-10 lg:py-14">
          <p className="premium-eyebrow">Private total-cost planning tool</p>
          <h1 className="mt-4 max-w-5xl font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
            Hearing Aid Cost Calculator for Written Quotes
          </h1>
          <p className="premium-prose mt-5 max-w-4xl text-lg">
            Enter amounts from a real provider quote to see the complete planned total. The
            calculator supplies no default prices, sends no form, and does not decide which device
            is appropriate for you.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="premium-chip">No market-price assumptions</span>
            <span className="premium-chip">No personal data required</span>
            <span className="premium-chip">Indian rupee calculation</span>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <HearingAidCostCalculator />
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="premium-section p-6 sm:p-8">
          <p className="premium-eyebrow">Quote checklist</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Collect these facts first</h2>
          <ul className="mt-6 grid gap-3">
            {checklist.map((item) => (
              <li key={item} className="rounded-2xl border border-slate-200 bg-white/75 p-4 text-sm leading-relaxed text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="premium-card p-6 sm:p-8">
          <p className="premium-eyebrow">Interpret the result</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Arithmetic is not advice</h2>
          <div className="premium-prose mt-5 space-y-4">
            <p>
              The calculator only adds and subtracts the amounts you enter. A lower calculated
              total does not establish device quality, clinical suitability, fitting quality,
              warranty value, or long-term support.
            </p>
            <p>
              When comparing providers, use the same categories and check that a service has not
              been bundled in one quote but added twice in another.
            </p>
            <p>
              Ask questions when an MRP, discount, stock status, validity date, warranty, included
              fitting, tax, or cancellation term is unclear.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/hearing-aid-prices-india" className="premium-button-secondary">
              Read the India Price Guide
            </Link>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-button-primary"
            >
              Ask About a Written Quote
            </a>
          </div>
        </article>
      </section>
    </main>
  );
}
