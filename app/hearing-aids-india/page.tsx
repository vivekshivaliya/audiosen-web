import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { isCatalogStagingPreviewEnabled } from "@/lib/catalog/launch";
import { getStagedCatalogBrands } from "@/lib/catalog/repository";
import { callHref, clinicContact, whatsappHref } from "@/lib/content";
import { StructuredData } from "@/lib/structured-data";

const pageUrl = "https://audiosen.com/hearing-aids-india";
const stagedBrands = getStagedCatalogBrands();
const catalogStagingPreviewEnabled = isCatalogStagingPreviewEnabled();

const careJourney = [
  {
    title: "Start with a conversation",
    description:
      "Tell Audiosen about your hearing concerns, location, daily listening situations, existing reports, and budget by phone, WhatsApp, or the enquiry form.",
  },
  {
    title: "Choose the right assessment",
    description:
      "The team explains whether you need a clinical audiology assessment, an ENT review, or an online orientation before comparing devices.",
  },
  {
    title: "Compare suitable hearing aids",
    description:
      "Review source-checked manufacturer information about styles, connectivity, charging, and fitting considerations before requesting written terms.",
  },
  {
    title: "Confirm the local pathway",
    description:
      "Ask which delivery, fitting, follow-up, maintenance, or repair steps, if any, can be confirmed for your location.",
  },
];

const guidanceAreas = [
  {
    title: "Online hearing-care guidance",
    description:
      "A private first conversation to understand your needs and prepare for the correct clinical or device-selection step.",
  },
  {
    title: "Hearing-aid selection",
    description:
      "Guidance across discreet, rechargeable, Bluetooth, in-ear, receiver-in-canal, behind-the-ear, power, and pediatric options.",
  },
  {
    title: "Assessment and fitting coordination",
    description:
      "Support for arranging an appropriate hearing assessment and a fitting pathway based on your hearing profile and location.",
  },
  {
    title: "Aftercare and repair guidance",
    description:
      "Help with cleaning, accessories, troubleshooting, adjustments, warranty questions, repair coordination, and long-term device care.",
  },
];

const decisionFactors = [
  "Your clinical hearing results and whether one or both ears need support",
  "Speech difficulty in quiet, groups, calls, meetings, television, and background noise",
  "Preferred style: RIC, BTE, ITE, CIC, rechargeable, power, pediatric, or CROS",
  "Phone compatibility, streaming, app controls, charger access, and dexterity",
  "Included fitting, follow-up adjustments, warranty, repair, and aftercare",
  "A written total cost that matches the device, service package, and campaign terms",
];

const faqs = [
  {
    question: "Can I send Audiosen an enquiry from anywhere in India?",
    answer:
      "Yes. Audiosen accepts hearing-care and hearing-aid enquiries from across India. The response confirms what online guidance or location-specific pathway, if any, is available; it does not promise delivery, fitting, a home visit, or aftercare coverage.",
  },
  {
    question: "Can I choose a hearing aid without a hearing test?",
    answer:
      "A clinical hearing assessment is normally the safest basis for choosing and programming a hearing aid. Audiosen can help you understand which assessment to arrange before selecting a device.",
  },
  {
    question: "Is the Audiosen online hearing test a diagnosis?",
    answer:
      "No. It is a device-relative orientation tool and cannot diagnose hearing loss or replace calibrated audiometry, ear examination, or medical advice.",
  },
  {
    question: "Are home visits available everywhere in India?",
    answer:
      "No. Home-visit enquiries are limited to the approved Dehradun service area. Outside that area, Audiosen can provide bounded consultation, device guidance, and coordinated support without promising an in-person visit.",
  },
  {
    question: "Which hearing-aid brands can I discuss with Audiosen?",
    answer:
      "Audiosen provides brand-neutral guidance using source-checked information for Phonak, Signia, Widex, and ReSound. This does not claim Audiosen stock, suitability, price, warranty, or nationwide fitting coverage.",
  },
  {
    question: "What should I do if my hearing changes suddenly?",
    answer:
      "Sudden or rapidly worsening hearing loss, especially in one ear or with severe dizziness, pain, discharge, or injury, needs prompt medical assessment. Do not wait for an online screening or hearing-aid enquiry.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: "Hearing-aid guidance and coordinated support enquiries across India",
    description:
      "India-wide enquiry intake for hearing-aid guidance, assessment planning, and location-specific fitting, repair, and aftercare coordination.",
    url: pageUrl,
    serviceType: "Hearing aid consultation, selection, fitting coordination, and aftercare",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    provider: {
      "@id": "https://audiosen.com/#organization",
    },
  },
  {
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
        name: "Hearing Aids Across India",
        item: pageUrl,
      },
    ],
  },
  {
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
  },
];

export const metadata: Metadata = {
  title: "Hearing Aids in India | Source-Checked Guidance | Audiosen",
  description:
    "Compare hearing aids and get online guidance, assessment planning, fitting coordination, repair guidance, and aftercare support from Audiosen across India.",
  alternates: {
    canonical: "/hearing-aids-india",
  },
  openGraph: {
    title: "Hearing Aids in India | Source-Checked Guidance | Audiosen",
    description:
      "Compare hearing aids and get online guidance, assessment planning, fitting coordination, repair guidance, and aftercare support from Audiosen across India.",
    url: pageUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/editorial/audiosen-hero-consultation-v3.webp",
        alt: "A hearing-care consultation with an older woman and a small hearing device",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hearing Aids in India | Source-Checked Guidance | Audiosen",
    description:
      "Compare hearing aids and get online guidance, assessment planning, fitting coordination, repair guidance, and aftercare support from Audiosen across India.",
    images: ["/images/editorial/audiosen-hero-consultation-v3.webp"],
  },
};

export default function HearingAidsIndiaPage() {
  return (
    <main>
      <StructuredData data={structuredData} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-sky-800">Home</Link>
          <span aria-hidden="true"> / </span>
          <span>Hearing Aids Across India</span>
        </nav>

        <div className="premium-shell grid items-center gap-9 overflow-hidden px-6 py-10 sm:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:py-14">
          <Reveal>
            <p className="premium-eyebrow">Audiosen · India-Wide Hearing Guidance</p>
            <h1 className="sonic-hero-title mt-4 font-display font-semibold leading-tight text-slate-900">
              Hearing Aids and Hearing Care Across India
            </h1>
            <p className="premium-prose mt-5 max-w-2xl text-lg">
              Start with clear guidance, arrange the right assessment, compare hearing-aid
              options, and ask which location-specific fitting or aftercare pathway can be confirmed.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="premium-chip">Online guidance</span>
              <span className="premium-chip">Manufacturer guidance</span>
              <span className="premium-chip">Location-based fitting support</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#india-enquiry" className="premium-button-primary">Request Consultation</Link>
              <Link href="/hearing-test" className="premium-button-secondary">Try the Online Sound Check</Link>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="premium-button-secondary">
                WhatsApp Audiosen
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-3 shadow-[0_30px_80px_-36px_rgba(8,68,119,0.55)]">
              <Image
                src="/images/editorial/audiosen-hero-consultation-v3.webp"
                alt="A hearing-care consultation with an older Indian woman and a discreet hearing device"
                width={1200}
                height={1500}
                priority
                className="h-[30rem] w-full rounded-[1.55rem] object-cover object-center"
              />
              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/80 bg-slate-950/80 p-4 text-white backdrop-blur-md">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">India-wide enquiries</p>
                <p className="mt-1 font-semibold">Source-checked guidance · local scope confirmed</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="premium-eyebrow mb-4">How the enquiry pathway works</p>
            <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              Four practical steps from concern to aftercare
            </h2>
            <p className="premium-prose mx-auto mt-4 max-w-3xl">
              Hearing aids work best when device selection is connected to assessment, fitting,
              realistic expectations, and follow-up care.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {careJourney.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.04} className="premium-card h-full p-6">
              <span className="premium-chip text-xs">Step {index + 1}</span>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
              <p className="premium-prose mt-3 text-sm">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="premium-section px-6 py-10 sm:px-8">
            <Reveal>
              <p className="premium-eyebrow mb-4">Location-specific guidance</p>
              <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
                Confirm what is available for your location and hearing needs
              </h2>
            </Reveal>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {guidanceAreas.map((service, index) => (
                <Reveal key={service.title} delay={index * 0.04} className="premium-card h-full p-6">
                  <h3 className="text-2xl font-semibold text-slate-900">{service.title}</h3>
                  <p className="premium-prose mt-3">{service.description}</p>
                </Reveal>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
              Audiosen accepts consultation, device-guidance, and coordinated-support enquiries
              across India. Clinic care and home visits are limited to the approved Dehradun service
              area and are confirmed directly before booking.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid items-end gap-5 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="premium-eyebrow mb-4">Manufacturer guidance</p>
              <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
                Compare brands only after understanding your needs
              </h2>
              <p className="premium-prose mt-4 max-w-3xl">
                Audiosen offers source-checked guidance about four manufacturer families and multiple
                styles. Availability, suitability, fitting requirements, and commercial terms are
                confirmed in writing.
              </p>
            </div>
            <Link href="#india-enquiry" className="premium-button-primary">Request Guidance</Link>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stagedBrands.map((brand, index) => (
            <Reveal key={brand.slug} delay={index * 0.03} className="premium-card h-full p-5">
              <h3 className="text-xl font-semibold text-slate-900">{brand.name} hearing-aid guidance</h3>
              <p className="premium-prose mt-2 text-sm">
                Review source-checked manufacturer information without an inventory, suitability,
                pricing, or commercial-relationship assumption.
              </p>
              {catalogStagingPreviewEnabled ? (
                <Link href={`/hearing-aids/${brand.slug}`} className="mt-4 inline-flex font-semibold text-teal-800 underline underline-offset-4">
                  Open {brand.name} guidance
                </Link>
              ) : null}
            </Reveal>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <Reveal>
            <p className="premium-eyebrow mb-4">Before comparing prices</p>
            <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              What should shape a hearing-aid recommendation?
            </h2>
            <p className="premium-prose mt-4">
              The lowest listed price is not always the lowest total cost. Ask what assessment,
              fitting, follow-up, warranty, accessories, and repair support are included.
            </p>
          </Reveal>

          <Reveal delay={0.06}>
            <ul className="premium-card grid gap-3 p-6 sm:grid-cols-2">
              {decisionFactors.map((factor) => (
                <li key={factor} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                  {factor}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="premium-eyebrow mb-4">Frequently asked questions</p>
            <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              Send a hearing-care enquiry from India
            </h2>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="premium-card p-6">
              <h3 className="text-xl font-semibold text-slate-900">{faq.question}</h3>
              <p className="premium-prose mt-3">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="india-enquiry" className="scroll-mt-32 py-14">
        <div className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <Reveal>
            <p className="premium-eyebrow mb-4">Tell us where you are</p>
            <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              Request an India-wide guidance response
            </h2>
            <p className="premium-prose mt-4">
              Share your city or pin code, current hearing reports if available, the situations that
              are difficult, and whether you already use hearing aids. The team will explain the
              appropriate next step and available support.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={callHref} className="premium-button-primary">Call {clinicContact.primaryCallDisplay}</a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="premium-button-secondary">
                Ask on WhatsApp
              </a>
              <Link href="/hearing-aids-dehradun" className="premium-button-secondary">Dehradun Care Enquiries</Link>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <ContactForm />
          </Reveal>
        </div>
      </section>
    </main>
  );
}
