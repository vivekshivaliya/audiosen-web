import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ApprovedBusinessDirectionsCard,
  ApprovedBusinessProfileCopy,
} from "@/components/approved-business-location";
import { ApprovedOffer } from "@/components/approved-offer";
import { CatalogModelCard } from "@/components/catalog/catalog-model-card";
import { EarEducation } from "@/components/ear-education";
import { Reveal } from "@/components/reveal";
import { ServiceCard } from "@/components/service-card";
import {
  callHref,
  clinicContact,
  websiteJsonLd,
  whatsappHref,
} from "@/lib/content";
import { hearingServices } from "@/lib/service-catalog";
import { getApprovedCatalogSnapshot } from "@/lib/catalog/approved-snapshot";
import { getActivePublicOffer } from "@/lib/offers/public";
import { getPublicGoogleReviews } from "@/lib/public-google-reviews";
import { StructuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Hearing Care Across India | Audiosen Advance Hearing Care Solutions",
  description:
    "India-wide hearing-device guidance, assessment planning, fitting coordination, repair support and speech-service enquiries with personalized support from Audiosen.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Hearing Care Across India | Audiosen Advance Hearing Care Solutions",
    description:
      "India-wide hearing-device guidance, assessment planning, fitting coordination, repair support and speech-service enquiries with personalized support from Audiosen.",
    url: "https://audiosen.com/",
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-image-v2.webp",
        width: 1200,
        height: 630,
        alt: "Audiosen hearing and communication care",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hearing Care Across India | Audiosen Advance Hearing Care Solutions",
    description:
      "India-wide hearing-device guidance, assessment planning, fitting coordination, repair support and speech-service enquiries with personalized support from Audiosen.",
    images: ["/og-image-v2.webp"],
  },
};

const trustItems = [
  {
    title: "Assessment-led guidance",
    description: "Device discussions follow an appropriate professional hearing assessment.",
  },
  {
    title: "Clear commercial terms",
    description: "Prices, availability and program terms are confirmed in writing—never guessed.",
  },
  {
    title: "Care beyond selection",
    description: "Fitting, programming, maintenance and follow-up are part of the conversation.",
  },
  {
    title: "India-wide support",
    description: "Guidance and coordination across India, with clinic care confirmed for Dehradun.",
  },
];

const brandTones = {
  phonak: "from-sky-50 to-cyan-100",
  signia: "from-fuchsia-50 to-rose-100",
  widex: "from-amber-50 to-orange-100",
  resound: "from-emerald-50 to-teal-100",
  oticon: "from-blue-50 to-cyan-100",
  starkey: "from-rose-50 to-pink-100",
} as const;

const careJourney = [
  "Hearing concern",
  "Hearing assessment",
  "Professional guidance",
  "Hearing solution",
  "Fitting & programming",
  "Speech / communication support",
  "Follow-up",
  "Ongoing hearing care",
];

const childSigns = [
  "delayed words or limited vocabulary",
  "unclear speech or pronunciation difficulty",
  "difficulty following spoken instructions",
  "frequent requests for repetition",
  "suspected hearing difficulty",
  "difficulty communicating in daily routines",
];

const reasons = [
  {
    title: "One coordinated starting point",
    description:
      "Discuss assessment, devices, repair, hearing follow-up and communication needs without navigating disconnected forms.",
  },
  {
    title: "Facts before promotion",
    description:
      "Unapproved prices, discounts, stock, credentials and reviews stay unpublished until their evidence is recorded.",
  },
  {
    title: "Human help when it matters",
    description:
      "Call, WhatsApp or send a structured request. The team confirms the appropriate service and location before booking.",
  },
];

const faqs = [
  {
    question: "Can Audiosen help me choose a hearing aid online?",
    answer:
      "Audiosen can explain styles and preferences online, but suitability and programming decisions require an appropriate professional hearing assessment.",
  },
  {
    question: "Does Audiosen provide care outside Dehradun?",
    answer:
      "Audiosen accepts enquiries across India for consultation, device guidance and coordinated support. Clinic and home-visit services are confirmed for the approved Dehradun service area only.",
  },
  {
    question: "Are prices, trials or discounts guaranteed on the website?",
    answer:
      "No. A price, trial, rental or offer appears only after its exact eligibility, dates and written terms are approved. Otherwise the team provides a personalized written response.",
  },
  {
    question: "Can I use the online sound check instead of a clinical test?",
    answer:
      "No. The browser check is device-relative and non-diagnostic. It cannot measure clinical hearing thresholds or replace an age-appropriate assessment.",
  },
  {
    question: "What should I do about sudden hearing change or severe ear symptoms?",
    answer:
      "Seek prompt medical assessment rather than relying on an online check or routine website enquiry—especially for sudden one-sided change, severe pain, discharge, injury, dizziness or neurological symptoms.",
  },
];

const nationalServiceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://audiosen.com/#care-guidance",
  name: "Hearing and communication care guidance and coordination",
  serviceType:
    "Consultation, hearing-device guidance, assessment planning, and location-based support coordination",
  description:
    "Audiosen accepts India-wide enquiries for guidance and coordinated support. In-person clinic and home-care availability is confirmed only for the approved Dehradun service area.",
  url: "https://audiosen.com/",
  areaServed: { "@type": "Country", name: "India" },
  provider: { "@id": "https://audiosen.com/#organization" },
};

export default async function HomePage() {
  const [catalogSnapshot, activeCampaign, publicReviews] = await Promise.all([
    getApprovedCatalogSnapshot(),
    getActivePublicOffer("50-percent-off"),
    getPublicGoogleReviews(),
  ]);
  const catalogSurfaceEnabled = catalogSnapshot !== null;
  const catalogBrowsePath = catalogSurfaceEnabled ? "/hearing-aids" : "/hearing-aids-india";
  const featuredModels = catalogSnapshot?.models.filter((model) => model.isFeatured).slice(0, 4) ?? [];
  return (
    <main id="main-content">
      <StructuredData data={[websiteJsonLd, nationalServiceJsonLd]} />

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-teal-900/10 bg-[linear-gradient(145deg,rgba(255,255,255,.98),rgba(228,247,243,.94))] p-5 shadow-[0_42px_100px_-60px_rgba(5,46,58,.7)] sm:p-8 lg:min-h-[calc(100svh-9rem)] lg:grid-cols-[1.02fr_.98fr] lg:p-10 xl:p-12">
          <div className="relative z-10">
            <p className="premium-eyebrow mb-4">Audiosen · Advance Hearing Care Solutions</p>
            <h1 className="max-w-3xl font-display text-[clamp(2.75rem,5.4vw,5.25rem)] font-semibold leading-[.95] tracking-[-.025em] text-slate-950">
              Hearing Care Across India, With Caring, Clear Support
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Start with a clear conversation about hearing concerns, modern devices, fitting,
              repair, home care or speech support—wherever you are in India.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/book-consultation"
                className="premium-button-primary"
                data-analytics-event="book_consultation"
                data-analytics-location="home_hero"
              >
                Book Consultation
              </Link>
              <Link
                href={catalogBrowsePath}
                className="premium-button-secondary"
                data-analytics-event="hearing_aid_view"
                data-analytics-location="home_hero"
              >
                Explore Hearing Aids
              </Link>
              <a
                href={callHref}
                className="inline-flex min-h-11 items-center px-2 font-extrabold text-teal-900 underline decoration-teal-300 underline-offset-4"
                data-analytics-event="call_click"
                data-analytics-location="home_hero"
              >
                Call {clinicContact.primaryCallDisplay}
              </a>
            </div>
            <div className="mt-7 grid max-w-2xl grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <span className="rounded-2xl border border-teal-900/10 bg-white/80 px-4 py-3 font-semibold text-slate-700">
                Hearing care
              </span>
              <span className="rounded-2xl border border-teal-900/10 bg-white/80 px-4 py-3 font-semibold text-slate-700">
                Device support
              </span>
              <span className="col-span-2 rounded-2xl border border-teal-900/10 bg-white/80 px-4 py-3 font-semibold text-slate-700 sm:col-span-1">
                Speech enquiries
              </span>
            </div>
          </div>
          <div className="relative min-h-[25rem] overflow-hidden rounded-[1.75rem] border border-white/25 bg-teal-950 sm:min-h-[32rem]">
            <Image
              src="/images/editorial/audiosen-hero-consultation-v3.webp"
              alt="Illustrative image of an audiologist helping an adult woman with a hearing aid"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 43vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-teal-950/85 via-teal-950/25 to-transparent px-5 pb-5 pt-20">
              <p className="max-w-sm text-sm font-semibold leading-6 text-white">
                Illustrative consultation scene · the right pathway is confirmed for your location.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="trust-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="premium-eyebrow">A clearer care journey</p>
            <h2 id="trust-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
              Trust is built into the details
            </h2>
          </div>
          <Link href="/about" className="font-bold text-teal-800 underline underline-offset-4">
            How Audiosen works
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.04} className="h-full rounded-[1.5rem] border border-teal-900/10 bg-white p-6">
              <span className="text-xs font-extrabold text-teal-700">0{index + 1}</span>
              <h3 className="mt-4 text-xl font-bold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="services" aria-labelledby="home-services-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="premium-eyebrow">Hearing care services</p>
          <h2 id="home-services-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
            Start with the service you need
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Each pathway explains what is confirmed before an appointment—without unsupported
            availability or outcome claims.
          </p>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {hearingServices.slice(0, 4).map((service, index) => (
            <ServiceCard key={service.slug} service={service} basePath="/services" index={index} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/services" className="premium-button-secondary">
            View All Hearing Care Services
          </Link>
        </div>
      </section>

      {activeCampaign ? (
        <section aria-label="Current approved offer" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <ApprovedOffer offer={activeCampaign} compact />
        </section>
      ) : null}

      {catalogSnapshot ? (
      <>
      <section aria-labelledby="brands-title" className="bg-slate-950 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-300">
                Manufacturer model guides
              </p>
              <h2 id="brands-title" className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
                Compare the details that affect daily life
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-slate-300">
                Explore structured model guides. Audiosen confirms local availability,
                compatibility, warranty and price individually before any purchase discussion.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {catalogSnapshot.brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/hearing-aids/${brand.slug}`}
                  className={`group min-h-32 rounded-[1.35rem] bg-gradient-to-br ${brandTones[brand.slug]} p-5 text-slate-950 transition hover:-translate-y-1 motion-reduce:transform-none`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Brand guide</span>
                  <strong className="mt-8 block text-xl">{brand.name}</strong>
                  <span className="mt-1 block text-sm text-slate-600 group-hover:underline">Explore models →</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <Link href={catalogBrowsePath} className="rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:bg-white/10">
              <span className="text-sm text-teal-200">Browse</span>
              <strong className="mt-2 block text-lg">Hearing-aid guidance</strong>
            </Link>
            <Link href="/compare-hearing-aids" className="rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:bg-white/10">
              <span className="text-sm text-teal-200">Compare</span>
              <strong className="mt-2 block text-lg">Styles and formats</strong>
            </Link>
            <Link href="/find-my-hearing-aid" className="rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:bg-white/10">
              <span className="text-sm text-teal-200">Find</span>
              <strong className="mt-2 block text-lg">Options worth discussing</strong>
            </Link>
          </div>
        </div>
      </section>

      {featuredModels.length ? (
        <section aria-labelledby="featured-models-title" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="premium-eyebrow">Featured model guides</p>
            <h2 id="featured-models-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
              Featured hearing-aid information
            </h2>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredModels.map((model) => {
              const brand = catalogSnapshot.brands.find((item) => item.slug === model.brandSlug);
              return brand ? <CatalogModelCard key={model.key} model={model} brand={brand} headingLevel="h3" /> : null;
            })}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="finder-home-title" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 rounded-[2rem] border border-violet-200 bg-[radial-gradient(circle_at_85%_10%,rgba(167,139,250,.28),transparent_30%),linear-gradient(135deg,#fff,#eef8f6)] p-7 sm:p-10 lg:grid-cols-[1fr_.8fr] lg:p-14">
          <div>
            <p className="premium-eyebrow">Find My Hearing Aid</p>
            <h2 id="finder-home-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
              Turn preferences into better questions
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              Tell us about charging, streaming, visibility and lifestyle preferences. The finder
              ranks guidance-ready model summaries for discussion—it does not diagnose or prescribe.
            </p>
            <Link href="/find-my-hearing-aid" className="premium-button-primary mt-7" data-analytics-event="hearing_aid_finder_start" data-analytics-location="home_finder">
              Start the Accessible Finder
            </Link>
          </div>
          <ol className="grid gap-3" aria-label="Finder steps">
            {["Share non-diagnostic preferences", "Review explainable matches", "Discuss with a professional"].map((step, index) => (
              <li key={step} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-100 font-extrabold text-violet-800">{index + 1}</span>
                <span className="font-semibold text-slate-800">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      </>
      ) : null}

      <section aria-labelledby="journey-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="premium-eyebrow">Integrated care journey</p>
          <h2 id="journey-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
            Hearing and communication care can connect
          </h2>
        </div>
        <ol className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {careJourney.map((step, index) => (
            <li key={step} className="h-full">
              <Reveal delay={index * 0.035} className="relative h-full rounded-2xl border border-slate-200 bg-white p-5">
                <span className="text-xs font-extrabold text-teal-700">STEP {index + 1}</span>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{step}</h3>
                {index < careJourney.length - 1 ? (
                  <span aria-hidden="true" className="absolute -bottom-3 left-1/2 z-10 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-teal-800 text-xs text-white sm:hidden">
                    ↓
                  </span>
                ) : null}
              </Reveal>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-7 text-slate-600">
          Not every person needs every step. The appropriate pathway depends on professional
          assessment, goals and confirmed service availability.
        </p>
      </section>

      <section aria-labelledby="child-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-amber-200 bg-[linear-gradient(135deg,#fffaf0,#edf9f5)] lg:grid-cols-[.9fr_1.1fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-amber-800">Children &amp; families</p>
            <h2 id="child-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
              Concerned about your child&apos;s speech or hearing?
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Start with an age-appropriate professional pathway. Children are never given device
              recommendations by the online finder.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/services/pediatric-hearing-care" className="premium-button-primary">Pediatric Hearing Care</Link>
              <Link href="/speech-language-services" className="premium-button-secondary">Speech &amp; Language Services</Link>
            </div>
          </div>
          <div className="bg-white/70 p-7 sm:p-10 lg:p-12">
            <h3 className="text-lg font-bold text-slate-900">Observations worth discussing</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {childSigns.map((sign) => (
                <li key={sign} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span aria-hidden="true" className="text-amber-700">●</span>
                  {sign}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              These signs do not confirm a diagnosis. Sudden or urgent symptoms need prompt medical assessment.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Home care and repair" className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="rounded-[2rem] bg-teal-950 p-7 text-white sm:p-10">
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-teal-300">India-wide support</p>
          <h2 className="mt-3 font-display text-4xl font-semibold">Home Hearing Care</h2>
          <p className="mt-4 leading-7 text-teal-50/80">
            Request assessment planning, device support or fitting guidance wherever you are. The
            team confirms the available location-based pathway before an appointment is accepted.
          </p>
          <Link href="/home-hearing-care" className="premium-button-primary mt-7 border-white bg-white text-teal-950" data-analytics-event="home_visit_request" data-analytics-location="home_service">
            Book Home Visit
          </Link>
        </article>
        <article className="rounded-[2rem] border border-slate-200 bg-white p-7 sm:p-10">
          <p className="premium-eyebrow">Device support</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-slate-950">Hearing Aid Repair</h2>
          <p className="mt-4 leading-7 text-slate-600">
            Share the brand, model and problem. Photos are accepted only through the protected
            repair-upload workflow and remain private.
          </p>
          <Link href="/hearing-aid-repair" className="premium-button-secondary mt-7" data-analytics-event="repair_enquiry" data-analytics-location="home_service">
            Request Repair
          </Link>
        </article>
      </section>

      {publicReviews.length ? (
        <section aria-labelledby="home-reviews-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="premium-eyebrow">Selected Google reviews</p>
              <h2 id="home-reviews-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
                Experiences shared by reviewers
              </h2>
            </div>
            <Link href="/review" className="font-bold text-teal-800 underline underline-offset-4">Review details</Link>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {publicReviews.slice(0, 3).map((review) => (
              <article key={review.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-slate-950">{review.reviewerDisplayName}</h3>
                  <span aria-label={`${review.starRating} out of 5 stars`} className="text-sm font-bold text-amber-700">
                    {"★".repeat(review.starRating)}{"☆".repeat(5 - review.starRating)}
                  </span>
                </div>
                {review.comment ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{review.comment}</p> : null}
                <p className="mt-4 text-xs text-slate-500">
                  Google review · <time dateTime={review.googleCreatedAt.toISOString()}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(review.googleCreatedAt)}</time>
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="why-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="premium-eyebrow">Why Audiosen</p>
          <h2 id="why-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
            Technology with a human care plan
          </h2>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {reasons.map((reason) => (
            <article key={reason.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-bold text-slate-950">{reason.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{reason.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="education-title" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <span id="education-title" className="sr-only">Hearing education</span>
        <EarEducation />
      </section>

      <section aria-labelledby="faq-title" className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="premium-eyebrow">Frequently asked questions</p>
          <h2 id="faq-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
            Clear answers before you book
          </h2>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5 open:border-teal-300">
              <summary className="min-h-11 cursor-pointer font-bold text-slate-950">{faq.question}</summary>
              <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="contact-home-title" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-[2rem] border border-teal-900/10 bg-white lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="premium-eyebrow">Contact Audiosen</p>
            <h2 id="contact-home-title" className="mt-3 font-display text-4xl font-semibold text-slate-950 sm:text-5xl">
              India-wide guidance. Clinic care in Dehradun.
            </h2>
            <ApprovedBusinessProfileCopy />
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={callHref} className="premium-button-primary">Call {clinicContact.primaryCallDisplay}</a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="premium-button-secondary">WhatsApp</a>
              <a href={`mailto:${clinicContact.email}`} className="premium-button-secondary">Email Support</a>
            </div>
          </div>
          <div className="grid place-items-center bg-[radial-gradient(circle_at_50%_35%,#c9f0e9,#5c9b98)] p-8 text-center">
            <ApprovedBusinessDirectionsCard />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-[linear-gradient(120deg,#062c3b,#075b60_55%,#36569c)] px-7 py-12 text-center text-white sm:px-10">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-200">Your next step</p>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">
            Let&apos;s make hearing and communication feel more manageable
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-200">
            Tell the team what you need. Your request is stored before delivery and never sent to analytics.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/book-consultation" className="premium-button-primary border-white bg-white text-teal-950">Book Consultation</Link>
            <a href={callHref} className="premium-button-secondary border-white/40 bg-white/10 text-white">Call {clinicContact.primaryCallDisplay}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
