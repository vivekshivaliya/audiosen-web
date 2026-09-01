import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import {
  brandIdentity,
  callHref,
  clinicContact,
  dehradunClinicJsonLd,
  siteMeta,
  whatsappHref,
} from "@/lib/content";
import { getStagedCatalogBrands } from "@/lib/catalog/repository";
import { isCatalogStagingPreviewEnabled } from "@/lib/catalog/launch";
import { createPageMetadata } from "@/lib/page-metadata";
import { StructuredData } from "@/lib/structured-data";

const pageUrl = "https://audiosen.com/hearing-aids-dehradun";
const metadataTitle = `Hearing Aid Store & Centre in Dehradun | ${brandIdentity.shortName}`;
const metadataDescription = `Find ${brandIdentity.shortName}, a hearing aid store and centre in Dehradun, for assessment-led device guidance, fitting coordination, repair support, and local enquiries.`;
const stagedBrands = getStagedCatalogBrands();
const catalogStagingPreviewEnabled = isCatalogStagingPreviewEnabled();

const localServices = [
  "Hearing aid sales and selection",
  "Hearing aid fitting and programming",
  "Hearing test and consultation",
  "Hearing aid repair and maintenance",
  "Home visit hearing care support",
  "Tinnitus counseling and hearing guidance",
  "Pure Tone Audiometry (PTA)",
  "Speech audiometry support",
];

const fittingSteps = [
  {
    title: "Consultation",
    description: "We understand your hearing concern, daily routine, budget, and preferred device style.",
  },
  {
    title: "Hearing Check",
    description: "The team guides you through the right hearing test or clinic evaluation before selection.",
  },
  {
    title: "Option Review",
    description: "You review suitable hearing aid styles and handling needs before final fitting.",
  },
  {
    title: "Fitting Support",
    description: "The device is programmed, adjusted, and supported with follow-up service when needed.",
  },
];

const relatedLocalServices = [
  {
    href: "/hearing-test-dehradun",
    title: "Hearing Test in Dehradun",
    description: "Understand clinic assessment options and how to prepare.",
  },
  {
    href: "/hearing-aid-repair-dehradun",
    title: "Hearing Aid Repair",
    description: "Request cleaning, troubleshooting, maintenance, or repair guidance.",
  },
  {
    href: "/home-hearing-care",
    title: "Home Hearing Care",
    description: "Ask whether a home visit is suitable and available for the requested service.",
  },
];

const faqs = [
  {
    question: "Where is Audiosen located in Dehradun?",
    answer: `${brandIdentity.organizationName} is located at ${clinicContact.address}. Use the directions link or call before travelling to confirm the suitable service and appointment time.`,
  },
  {
    question: "Can I buy hearing aids near Dehradun from Audiosen?",
    answer:
      "Audiosen accepts assessment-led hearing-aid enquiries in Dehradun. A written response confirms the appropriate care pathway, model availability, commercial terms, fitting, and support before you proceed.",
  },
  {
    question: "Which hearing aid brands can I research here?",
    answer:
      "Audiosen provides brand-neutral guidance using source-checked information for Phonak, Signia, Widex, and ReSound. This does not claim that a model is in stock or suitable for you; both are confirmed individually.",
  },
  {
    question: "Do I need an appointment for a hearing aid consultation?",
    answer:
      "Appointments are recommended so the team can reserve time for consultation, hearing assessment guidance, device discussion, and fitting support.",
  },
  {
    question: "How much does a hearing aid cost in Dehradun?",
    answer:
      "Hearing aid cost depends on hearing loss, device style, brand, technology level, warranty, and fitting needs. Audiosen shares suitable options after consultation.",
  },
  {
    question: "Does Audiosen repair hearing aids?",
    answer:
      "Yes. Audiosen provides hearing aid cleaning, maintenance, repair guidance, battery or charging support, and follow-up service.",
  },
  {
    question: "Is home visit hearing care available in Dehradun?",
    answer:
      "Home visit support may be available depending on location, service requirement, and team availability. Call or WhatsApp Audiosen to confirm.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
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
      name: "Hearing Aids Dehradun",
      item: pageUrl,
    },
  ],
};

export const metadata: Metadata = {
  ...createPageMetadata({
    title: metadataTitle,
    description: metadataDescription,
    path: "/hearing-aids-dehradun",
    image: siteMeta.ogImage,
    imageAlt: `${brandIdentity.shortName} hearing aid store and centre in Dehradun`,
  }),
  keywords:
    "hearing aid near Dehradun, hearing aids Dehradun, hearing aid centre Dehradun, hearing test Dehradun, hearing aid fitting Dehradun, hearing aid repair Dehradun",
};

export default function HearingAidsDehradunPage() {
  return (
    <main>
      <StructuredData data={[dehradunClinicJsonLd, faqJsonLd, breadcrumbJsonLd]} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
        <div className="premium-shell grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div>
            <p className="premium-eyebrow mb-4">Dehradun hearing-care enquiries</p>
            <h1 className="font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
              Hearing Aid Centre in Dehradun
            </h1>
            <p className="premium-prose mt-5 max-w-2xl text-lg">
              Contact {brandIdentity.organizationName} for hearing-aid guidance, fitting
              coordination, repair support, and hearing-care enquiries in Dehradun. Visit us at
              {" "}{clinicContact.address}; please call ahead to confirm the suitable service and appointment time.
            </p>

            <div className="mt-6 rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-sky-800">Clinic address</p>
              <p className="mt-2 text-base font-semibold leading-relaxed text-slate-900">
                {clinicContact.address}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Call or get directions before travelling.
              </p>
              <a href={clinicContact.mapsHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex font-semibold text-sky-800 underline underline-offset-4">Get directions</a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
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
            </div>
          </div>

          <div className="glass-panel p-5 sm:p-7">
            <Image
              src="/images/3d/generic-ric-fallback-v1.webp"
              alt="Brand-neutral receiver-in-canal hearing device visualization"
              width={1200}
              height={1200}
              priority
              className="premium-card h-80 w-full bg-gradient-to-br from-slate-50 to-teal-50 object-contain object-center p-6"
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="premium-card-soft p-4">
                <p className="text-2xl font-black text-sky-800">4</p>
                <p className="mt-1 text-sm text-slate-600">Source-checked brand families</p>
              </div>
              <div className="premium-card-soft p-4">
                <p className="text-2xl font-black text-sky-800">Confirm</p>
                <p className="mt-1 text-sm text-slate-600">Timing before travel</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="premium-eyebrow mb-4">Local Hearing Care</p>
            <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              Hearing aids, fitting, repair, and tests in Dehradun
            </h2>
            <p className="premium-prose mt-4">
              Audiosen supports patients who need practical hearing guidance in Dehradun,
              including device selection, fitting, after-sales care, and maintenance.
            </p>
            <Link href="#appointment" className="premium-button-primary mt-6">
              Book Hearing Aid Consultation
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {localServices.map((service) => (
              <div key={service} className="premium-card p-5">
                <h3 className="text-lg font-semibold text-slate-900">{service}</h3>
                <p className="premium-prose mt-2 text-sm">
                  Ask {brandIdentity.organizationName} to confirm the appropriate Dehradun pathway
                  and current appointment scope.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="premium-section px-6 py-10 sm:px-8">
            <div className="text-center">
              <p className="premium-eyebrow mb-4">How Fitting Works</p>
              <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
                A clear path from concern to better hearing
              </h2>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {fittingSteps.map((step, index) => (
                <article key={step.title} className="premium-card p-5">
                  <span className="premium-chip text-xs">Step {index + 1}</span>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="premium-prose mt-2 text-sm">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="premium-eyebrow mb-4">Manufacturer model guides</p>
          <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Research before a model-specific discussion
          </h2>
          <p className="premium-prose mx-auto mt-4 max-w-3xl">
            Audiosen helps compare suitable hearing aid styles and technology levels after
            consultation, hearing needs review, and comfort discussion.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stagedBrands.map((brand) => (
            <article key={brand.slug} className="premium-card p-5">
              <h3 className="text-xl font-semibold text-slate-900">{brand.name}</h3>
              <p className="premium-prose mt-2 text-sm">
                Review source-checked manufacturer information. Local stock, suitability, price,
                warranty, and image rights are not implied by this guide.
              </p>
              {catalogStagingPreviewEnabled ? (
                <Link href={`/hearing-aids/${brand.slug}`} className="mt-4 inline-flex font-semibold text-sky-800 underline underline-offset-4">
                  Open {brand.name} guidance
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section id="appointment" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="premium-shell p-6 sm:p-8">
              <h2 className="font-display text-4xl font-semibold text-slate-900">
                Visit Audiosen in Dehradun
              </h2>
              <p className="premium-prose mt-4">
                Find us at {clinicContact.address}. Call or WhatsApp before travelling to
                confirm the appropriate service, appointment time, and availability for your request.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={callHref} className="premium-button-primary">
                  Call {clinicContact.primaryCallDisplay}
                </a>
                <a href={clinicContact.mapsHref} target="_blank" rel="noopener noreferrer" className="premium-button-secondary">Get Directions</a>
                <Link href="/hearing-test" className="premium-button-secondary">
                  Take Online Hearing Test
                </Link>
              </div>
          </div>

          <div>
            <h2 className="mb-4 font-display text-4xl font-semibold text-slate-900">
              Book a Dehradun hearing aid appointment
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="premium-section px-6 py-10 sm:px-8">
          <p className="premium-eyebrow mb-4">Plan your next step</p>
          <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Local hearing-care information
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedLocalServices.map((service) => (
              <Link key={service.href} href={service.href} className="premium-card p-5">
                <h3 className="text-lg font-semibold text-sky-900">{service.title}</h3>
                <p className="premium-prose mt-2 text-sm">{service.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="premium-eyebrow mb-4">Questions</p>
          <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Hearing aid FAQs for Dehradun patients
          </h2>
        </div>

        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="premium-card p-6">
              <h3 className="text-xl font-semibold text-slate-900">{faq.question}</h3>
              <p className="premium-prose mt-2">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
