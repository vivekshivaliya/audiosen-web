import Link from "next/link";
import {
  callHref,
  clinicianProfiles,
  clinicContact,
  localSeoBlogIdeas,
  whatsappHref,
} from "@/lib/content";
import type { LocalServicePageContent } from "@/lib/types";

type LocalServicePageProps = {
  content: LocalServicePageContent;
};

export function LocalServicePage({ content }: LocalServicePageProps) {
  const localServiceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: content.heroTitle,
    description: content.description,
    serviceType: content.title,
    areaServed: ["Dehradun", "Uttarakhand", "India"],
    provider: {
      "@type": "MedicalBusiness",
      "@id": "https://audiosen.com/#business",
      name: clinicContact.company,
      telephone: clinicContact.primaryCallE164,
      url: "https://audiosen.com/",
    },
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localServiceJsonLd) }}
      />
      <section className="premium-shell p-7 sm:p-10">
        <p className="premium-eyebrow">{content.heroEyebrow}</p>
        <h1 className="mt-4 max-w-5xl font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          {content.heroTitle}
        </h1>
        <p className="premium-prose mt-4 max-w-4xl text-base sm:text-lg">{content.heroSummary}</p>
        <p className="mt-3 max-w-4xl rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm font-medium text-sky-900 sm:text-base">
          Hindi (Roman): {content.heroSummaryHi}
        </p>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.1em] text-slate-600">
          {content.primaryIntent}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={callHref} className="premium-button-primary">
            Call {clinicContact.primaryCallDisplay}
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="premium-button-secondary"
          >
            WhatsApp {clinicContact.whatsappDisplay}
          </a>
          <Link href="/#contact" className="premium-button-secondary">
            Book Callback Form
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="premium-card p-6">
          <h2 className="text-2xl font-semibold text-slate-900">Treatments and Services</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
            {content.treatmentList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="premium-card p-6">
          <h2 className="text-2xl font-semibold text-slate-900">Pricing Range Guidance</h2>
          <div className="mt-4 grid gap-3">
            {content.pricing.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{item.range}</p>
                <p className="mt-1 text-sm text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="premium-card p-6">
          <h2 className="text-2xl font-semibold text-slate-900">Trust Signals for Patients</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700 sm:text-base">
            {content.trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
            Patient review response policy: every review is acknowledged within 24 hours.
          </p>
        </article>
        <article className="premium-card p-6">
          <h2 className="text-2xl font-semibold text-slate-900">Bilingual Support</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
            {content.bilingualHighlights.map((line) => (
              <li key={line} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                {line}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-8 premium-shell p-6 sm:p-8">
        <h2 className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
          Clinician Profiles and Credentials
        </h2>
        <p className="premium-prose mt-3 max-w-4xl">
          These profiles are shown to strengthen trust for health-related search journeys. We advise
          displaying complete registration details on consultation documents and at clinic reception.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {clinicianProfiles.map((person) => (
            <article key={person.name} className="premium-card p-5">
              <h3 className="text-lg font-semibold text-slate-900">{person.name}</h3>
              <p className="mt-1 text-sm font-medium text-sky-800">{person.title}</p>
              <p className="mt-3 text-sm text-slate-700">{person.credentials}</p>
              <p className="mt-3 text-sm text-slate-700">
                <strong>Registration:</strong> {person.registration}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <strong>Expertise:</strong> {person.expertise}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <strong>Languages:</strong> {person.languages}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="premium-card p-6">
          <h2 className="text-2xl font-semibold text-slate-900">Clinic Contact and NAP</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700 sm:text-base">
            <p>
              <strong>Clinic:</strong> {clinicContact.company}
            </p>
            <p>
              <strong>Address:</strong> {clinicContact.streetAddress}, {clinicContact.locality},{" "}
              {clinicContact.region} {clinicContact.postalCode}, India
            </p>
            <p>
              <strong>Call:</strong> {clinicContact.primaryCallDisplay}
            </p>
            <p>
              <strong>WhatsApp:</strong> {clinicContact.whatsappDisplay}
            </p>
            <p>
              <strong>Email:</strong> {clinicContact.email}
            </p>
            <p>
              <strong>Hours:</strong> {clinicContact.openingHoursText}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={callHref} className="premium-button-primary text-sm">
              Call Clinic
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-button-secondary text-sm"
            >
              WhatsApp Clinic
            </a>
            <a
              href={clinicContact.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-button-secondary text-sm"
            >
              Open in Maps
            </a>
          </div>
        </article>

        <article className="premium-card overflow-hidden">
          <iframe
            title="Audiosen Dehradun map"
            src={clinicContact.mapEmbedUrl}
            loading="lazy"
            className="h-full min-h-[320px] w-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </article>
      </section>

      <section className="mt-8 premium-shell p-6 sm:p-8">
        <h2 className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="premium-prose mt-3 max-w-4xl">
          These answers are written for users first. We do not rely on FAQ snippets for ranking.
        </p>
        <div className="mt-5 space-y-3">
          {content.faqs.map((faq) => (
            <details key={faq.question} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900 sm:text-base">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8 premium-shell p-6 sm:p-8">
        <h2 className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
          High-Intent Local Content
        </h2>
        <p className="premium-prose mt-3 max-w-4xl">
          Publish and keep updating these topics to strengthen organic reach for Dehradun intent
          searches.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {localSeoBlogIdeas.map((post) => (
            <Link
              key={post.href}
              href={post.href}
              className="premium-card block p-4 transition hover:-translate-y-0.5"
            >
              <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{post.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
