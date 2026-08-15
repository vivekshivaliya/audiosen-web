import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import {
  brands,
  callHref,
  clinicContact,
  siteMeta,
  whatsappHref,
} from "@/lib/content";

const pageUrl = "https://audiosen.com/hearing-aids-dehradun";

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
    title: "Device Trial",
    description: "You compare suitable hearing aid styles from trusted brands before final fitting.",
  },
  {
    title: "Fitting Support",
    description: "The device is programmed, adjusted, and supported with follow-up service when needed.",
  },
];

const faqs = [
  {
    question: "Where is Audiosen located in Dehradun?",
    answer:
      "Audiosen Hearing Care Solutions is at Dwarka Clinics, 3rd Floor ENT Department, Race Course Road, near Punjab National Bank, Dehradun, Uttarakhand 248001.",
  },
  {
    question: "Can I buy hearing aids near Dehradun from Audiosen?",
    answer:
      "Yes. Audiosen helps patients choose, fit, and support hearing aids from trusted brands after consultation and hearing needs review.",
  },
  {
    question: "Which hearing aid brands are available?",
    answer:
      "Audiosen supports leading hearing aid brands including Phonak, Signia, Widex, ReSound, Oticon, and Starkey, subject to stock and suitability.",
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
  title: "Hearing Aid Near Dehradun | Audiosen Hearing Care Solutions",
  description:
    "Visit Audiosen Hearing Care Solutions at Dwarka Clinics, Race Course Road, Dehradun for hearing aids, hearing tests, fitting, repair, and support.",
  keywords:
    "hearing aid near Dehradun, hearing aids Dehradun, hearing aid centre Dehradun, hearing test Dehradun, hearing aid fitting Dehradun, hearing aid repair Dehradun",
  alternates: {
    canonical: "/hearing-aids-dehradun",
  },
  openGraph: {
    title: "Hearing Aid Near Dehradun | Audiosen Hearing Care Solutions",
    description:
      "Hearing aid consultation, fitting, repair, and hearing tests at Dwarka Clinics, Race Course Road, Dehradun.",
    url: pageUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [{ url: siteMeta.ogImage }],
  },
};

export default function HearingAidsDehradunPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
        <div className="premium-shell grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div>
            <p className="premium-eyebrow mb-4">Race Course Road, Dehradun</p>
            <h1 className="font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
              Hearing Aid Centre Near Dehradun
            </h1>
            <p className="premium-prose mt-5 max-w-2xl text-lg">
              Visit Audiosen Hearing Care Solutions for hearing aid consultation, fitting,
              repair, and hearing care support at Dwarka Clinics, 3rd Floor ENT Department,
              Race Course Road, near Punjab National Bank.
            </p>

            <div className="mt-6 rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-sky-800">Clinic Address</p>
              <p className="mt-2 text-base font-semibold leading-relaxed text-slate-900">
                {clinicContact.formattedAddress}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Open {clinicContact.openingHoursText}. Landmark: {clinicContact.landmark}.
              </p>
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
              <a
                href={clinicContact.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="premium-button-secondary"
              >
                Get Directions
              </a>
            </div>
          </div>

          <div className="glass-panel p-5 sm:p-7">
            <Image
              src="/images/services/hearing-aid-trial.jpg"
              alt="Patient trying hearing aids with an audiologist in Dehradun"
              width={1200}
              height={800}
              priority
              className="premium-card h-80 w-full object-cover object-center"
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="premium-card-soft p-4">
                <p className="text-2xl font-black text-sky-800">6+</p>
                <p className="mt-1 text-sm text-slate-600">Trusted hearing aid brands</p>
              </div>
              <div className="premium-card-soft p-4">
                <p className="text-2xl font-black text-sky-800">9 AM-7 PM</p>
                <p className="mt-1 text-sm text-slate-600">Monday to Saturday support</p>
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
              Audiosen supports patients who need practical hearing guidance near Race Course
              Road, including device selection, fitting, after-sales care, and maintenance.
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
                  Available through Audiosen Hearing Care Solutions in Dehradun.
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
          <p className="premium-eyebrow mb-4">Available Brands</p>
          <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Trusted hearing aid options in Dehradun
          </h2>
          <p className="premium-prose mx-auto mt-4 max-w-3xl">
            Audiosen helps compare suitable hearing aid styles and technology levels after
            consultation, hearing needs review, and comfort discussion.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <article key={brand.slug} className="premium-card p-5">
              <Image
                src={brand.logo}
                alt={`${brand.name} hearing aid brand logo`}
                width={140}
                height={64}
                className="h-12 w-auto object-contain"
              />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{brand.name}</h3>
              <p className="premium-prose mt-2 text-sm">{brand.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="appointment" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="premium-shell overflow-hidden">
            <iframe
              title="Audiosen Hearing Care Solutions map in Dehradun"
              src={clinicContact.mapEmbedUrl}
              className="h-80 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-6 sm:p-8">
              <h2 className="font-display text-4xl font-semibold text-slate-900">
                Visit Audiosen on Race Course Road
              </h2>
              <p className="premium-prose mt-4">
                Use directions to reach Dwarka Clinics, 3rd Floor ENT Department, near Punjab
                National Bank. Call before visiting if you need hearing aid trial, repair, or
                home visit guidance.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={clinicContact.mapUrl} target="_blank" rel="noopener noreferrer" className="premium-button-primary">
                  Open Google Maps
                </a>
                <Link href="/hearing-test" className="premium-button-secondary">
                  Take Online Hearing Test
                </Link>
              </div>
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
