import type { Metadata } from "next";
import Link from "next/link";
import { EnquiryRequestForm } from "@/components/enquiry-request-form";
import { StructuredData } from "@/lib/structured-data";

const pagePath = "/audiogram-guidance";
const pageUrl = `https://audiosen.com${pagePath}`;

export const metadata: Metadata = {
  title: "Share an Existing Audiogram Securely | Audiosen",
  description:
    "Send a protected enquiry with an optional existing audiogram so Audiosen can confirm the appropriate consultation pathway.",
  alternates: { canonical: pagePath },
  openGraph: {
    title: "Share an Existing Audiogram Securely | Audiosen",
    description:
      "Send a protected enquiry with an optional existing audiogram so Audiosen can confirm the appropriate consultation pathway.",
    url: pageUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: ["/og-image-v2.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Share an Existing Audiogram Securely | Audiosen",
    description:
      "Send a protected enquiry with an optional existing audiogram so Audiosen can confirm the appropriate consultation pathway.",
    images: ["/og-image-v2.webp"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: "Existing audiogram consultation enquiry",
      serviceType: "Care-pathway enquiry using an existing professional hearing report",
      url: pageUrl,
      provider: { "@id": "https://audiosen.com/#organization" },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
        { "@type": "ListItem", position: 2, name: "Services", item: "https://audiosen.com/services" },
        { "@type": "ListItem", position: 3, name: "Audiogram guidance", item: pageUrl },
      ],
    },
  ],
};

export default function AudiogramGuidancePage() {
  return (
    <main id="main-content">
      <StructuredData data={structuredData} />
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/services">Services</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Audiogram guidance</span>
        </nav>
        <div className="premium-shell grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.05fr_.95fr] lg:p-14">
          <div>
            <p className="premium-eyebrow">Private report pathway</p>
            <h1 className="mt-4 font-display text-5xl font-semibold text-slate-950 sm:text-6xl">
              Share an existing audiogram securely
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              If you already have a professional hearing report, you may attach it to a protected
              enquiry. Audiosen uses it only to help confirm the appropriate next consultation step.
            </p>
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
              An uploaded report is not re-diagnosed by this website, does not prove device
              suitability, and does not replace an age-appropriate clinical assessment. Urgent or
              sudden symptoms need prompt medical assessment rather than a website request.
            </div>
          </div>
          <div className="grid gap-4 text-sm leading-7 text-slate-700">
            {[
              "Accepted files begin in a non-public quarantine path.",
              "The server checks size, declared type, and magic bytes before intake.",
              "Staff access remains blocked until malware scanning and safe promotion complete.",
              "The website CRM coordinates an enquiry; it is not a clinical-record system.",
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-100 font-bold text-teal-900">
                  {index + 1}
                </span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[.75fr_1.25fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">Before you send</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-950">
            Share the minimum needed
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Remove unrelated identity documents and do not upload payment details. A parent or legal
            guardian must consent for a patient under 18.
          </p>
          <Link href="/privacy-policy" className="mt-5 inline-block font-bold text-teal-800 underline underline-offset-4">
            Read the privacy notice
          </Link>
        </div>
        <EnquiryRequestForm
          type="audiogram"
          variant="audiogram"
          sourcePath={pagePath}
          service="Existing audiogram consultation guidance"
          context={{ journey: "audiogram_guidance" }}
          heading="Send an audiogram enquiry"
          intro="The file is optional. You can still ask for the appropriate assessment pathway without uploading a report."
          submitLabel="Send secure enquiry"
        />
      </section>
    </main>
  );
}
