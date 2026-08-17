import type { Metadata } from "next";
import Link from "next/link";
import { clinicContact } from "@/lib/content";

const pageUrl = "https://audiosen.com/editorial-policy";

export const metadata: Metadata = {
  title: "Editorial Policy | Audiosen",
  description:
    "Read how Audiosen creates, reviews, sources, labels, corrects, and updates hearing-care, product, price, and promotional website content.",
  alternates: { canonical: "/editorial-policy" },
  openGraph: {
    title: "Editorial Policy | Audiosen",
    description:
      "Audiosen's standards for accurate, transparent, useful, and responsibly reviewed hearing-care information.",
    url: pageUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/editorial/policy-trust-v2.webp",
        alt: "A professional reviewing Audiosen policy and trust information",
      },
    ],
  },
};

const standards = [
  {
    title: "People-first purpose",
    description:
      "Content must help a reader understand a decision, prepare useful questions, or find an appropriate next step. Pages are not created only to repeat search terms.",
  },
  {
    title: "Visible responsibility",
    description:
      "Every substantive health article should identify its writer, any qualified clinical reviewer, publication date, review date, and sources. A review label appears only after that review occurred.",
  },
  {
    title: "Evidence and attribution",
    description:
      "Health statements should use current, relevant primary or authoritative sources. Product specifications should come from the manufacturer or verified commercial records.",
  },
  {
    title: "Commercial transparency",
    description:
      "Prices, discounts, stock, warranty, fitting, inclusions, exclusions, and campaign dates must match an approved written source. Editorial explanation and promotional terms remain distinguishable.",
  },
  {
    title: "Appropriate limitations",
    description:
      "Educational pages do not diagnose, prescribe, or replace examination, calibrated assessment, emergency care, or advice from an appropriately qualified professional.",
  },
  {
    title: "Respectful language",
    description:
      "Audiosen aims to use clear, accessible language, avoid fear-based selling, respect personal preferences, and explain uncertainty or service limitations directly.",
  },
];

const workflow = [
  {
    title: "1. Define the reader need",
    description:
      "The content brief states the audience, question, intended outcome, risks of misunderstanding, and facts that require verification.",
  },
  {
    title: "2. Gather sources and business facts",
    description:
      "The writer collects authoritative references and verified internal records before drafting clinical, professional, price, warranty, location, or offer claims.",
  },
  {
    title: "3. Draft with clear boundaries",
    description:
      "The page separates education from personal advice and states when availability, assessment, written quotation, or professional evaluation is required.",
  },
  {
    title: "4. Review and approve",
    description:
      "An accountable editor checks clarity and evidence. Health content receives qualified clinical review before that status is displayed. Commercial terms require business approval.",
  },
  {
    title: "5. Publish and monitor",
    description:
      "The page records genuine publication and update dates. Feedback, source changes, product changes, and safety issues can trigger a correction or fresh review.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "Audiosen Editorial Policy",
      description:
        "Audiosen's standards for creating, reviewing, sourcing, labelling, correcting, and updating website content.",
      inLanguage: "en-IN",
      dateModified: "2026-08-17",
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
          name: "Editorial Policy",
          item: pageUrl,
        },
      ],
    },
  ],
};

export default function EditorialPolicyPage() {
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
          <span>Editorial Policy</span>
        </nav>

        <div className="premium-shell px-6 py-10 sm:px-10 lg:py-14">
          <p className="premium-eyebrow">How Audiosen earns reader trust</p>
          <h1 className="mt-4 max-w-5xl font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
            Audiosen Editorial Policy
          </h1>
          <p className="premium-prose mt-5 max-w-4xl text-lg">
            This policy explains how Audiosen creates and maintains hearing-care education,
            product guidance, service information, price explanations, and promotional content.
            Accuracy, verifiable expertise, transparent commercial terms, and reader safety take
            priority over publishing speed.
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-600">
            Last updated: <time dateTime="2026-08-17">17 August 2026</time>
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="premium-eyebrow">Publishing standards</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            What every Audiosen page should protect
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {standards.map((standard) => (
            <article key={standard.title} className="premium-card h-full p-6">
              <h3 className="text-xl font-semibold text-slate-900">{standard.title}</h3>
              <p className="premium-prose mt-3 text-sm">{standard.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="premium-section px-6 py-10 sm:px-8">
            <p className="premium-eyebrow">Editorial workflow</p>
            <h2 className="mt-4 max-w-4xl font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              From question to accountable publication
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
              {workflow.map((step, index) => (
                <article key={step.title} className="premium-card h-full p-5">
                  <span className="premium-chip text-xs">Stage {index + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="premium-prose mt-3 text-sm">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="premium-card p-7">
          <p className="premium-eyebrow">Professional profiles</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">Verification before visibility</h2>
          <p className="premium-prose mt-4">
            Audiosen publishes a clinician or expert profile only after checking identity,
            qualifications, registration information where applicable, role and scope, biography,
            photograph consent, and permission to publish. A profile is removed or corrected if
            those facts can no longer be verified.
          </p>
          <Link href="/experts" className="mt-5 inline-flex font-semibold text-sky-800 underline underline-offset-4">
            View the verified-expert policy and directory
          </Link>
        </article>

        <article className="premium-card p-7">
          <p className="premium-eyebrow">Tools and automation</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">Human accountability remains required</h2>
          <p className="premium-prose mt-4">
            Research, writing, editing, accessibility, or technical tools may assist the workflow,
            but they do not replace source verification, clinical review, commercial approval, or
            editorial accountability. Audiosen does not label automated output as professional
            medical advice.
          </p>
        </article>

        <article className="premium-card p-7">
          <p className="premium-eyebrow">Corrections</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">Material errors are corrected clearly</h2>
          <p className="premium-prose mt-4">
            Audiosen reviews credible correction requests. Safety, identity, credential, price,
            offer, warranty, location, and service-availability errors receive priority. A material
            change updates the page date and, when useful to readers, includes a correction note.
          </p>
        </article>

        <article className="premium-card p-7">
          <p className="premium-eyebrow">Feedback route</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">Report a concern with evidence</h2>
          <p className="premium-prose mt-4">
            Email the page URL, the statement in question, why it may be wrong, and any supporting
            source to{" "}
            <a href={`mailto:${clinicContact.email}`} className="font-semibold text-sky-800 underline underline-offset-4">
              {clinicContact.email}
            </a>
            . Privacy or legal requests are handled under the applicable Audiosen policies.
          </p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="premium-shell p-6 sm:p-8">
          <h2 className="font-display text-3xl font-semibold text-slate-900">Related policies</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/privacy-policy" className="premium-card p-4 font-semibold text-sky-800">
              Privacy Policy
            </Link>
            <Link href="/legal" className="premium-card p-4 font-semibold text-sky-800">
              Legal Information
            </Link>
            <Link href="/terms-of-service" className="premium-card p-4 font-semibold text-sky-800">
              Terms of Service
            </Link>
            <Link href="/accessibility" className="premium-card p-4 font-semibold text-sky-800">
              Accessibility
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
