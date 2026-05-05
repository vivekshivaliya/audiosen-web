import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BrandShowcase } from "@/components/brand-showcase";
import { ContactForm } from "@/components/contact-form";
import { HearingTest } from "@/components/hearing-test";
import { Reveal } from "@/components/reveal";
import { ServicesExplorer } from "@/components/services-explorer";
import {
  brands,
  contactContent,
  heroContent,
  providerHighlights,
  rentalPlans,
  rentalTerms,
  services,
  solutionAreas,
  subscriptionPlans,
} from "@/lib/content";

const rentalSpotlightDevices = [
  {
    src: "/images/products/official/phonak-lumity-l90.png",
    alt: "Phonak Lumity L90 hearing aid",
  },
  {
    src: "/images/products/official/signia-charge-and-go-ix.jpg",
    alt: "Signia Charge and Go IX hearing aid",
  },
  {
    src: "/images/products/official/starkey-genesis-ai.png",
    alt: "Starkey Genesis AI hearing aid",
  },
  {
    src: "/images/products/official/phonak-audeo-paradise.png",
    alt: "Phonak Audeo Paradise hearing aid",
  },
  {
    src: "/images/products/official/resound-nexia.png",
    alt: "ReSound Nexia hearing aid",
  },
  {
    src: "/images/products/official/widex-moment.png",
    alt: "Widex Moment hearing aid",
  },
];

const subscriptionTerms = [
  "Subscription is available only after hearing consultation.",
  "Physical payment only at the clinic.",
  "No online checkout or payment gateway is shown on the website.",
  "Plan benefits apply only during the active plan period.",
  "Extra repair parts, accessories, or major servicing can be billed separately.",
];

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <main>
      <section id="home" className="mx-auto w-full max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
        <div className="premium-shell grid items-center gap-10 px-6 py-10 sm:px-10 lg:grid-cols-2 lg:py-14">
          <Reveal>
            <div>
              <p className="premium-eyebrow mb-4">Hearing Care Services & Hearing Aid Solutions</p>
              <h1 className="font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
                {heroContent.title}
              </h1>
              <p className="premium-prose mt-5 max-w-xl text-lg">{heroContent.subtitle}</p>
              <div className="premium-chip mt-6">{heroContent.sideNote}</div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={heroContent.ctaHref} className="premium-button-primary">
                  {heroContent.ctaLabel}
                </Link>
                <Link href="#brands" className="premium-button-secondary">
                  Explore Hearing Aids
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass-panel p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                <div className="premium-card relative flex min-h-[360px] items-center justify-center overflow-hidden p-6">
                  <span className="premium-chip absolute left-4 top-4">Phonak Infinio</span>
                  <Image
                    src="/images/products/phonak/audeo-sphere-infinio.png"
                    alt="Phonak Audeo Sphere Infinio premium hearing aid"
                    width={900}
                    height={900}
                    className="max-h-[280px] w-full object-contain drop-shadow-2xl"
                    priority
                  />
                  <p className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 px-3 py-2 text-center text-sm font-semibold text-slate-800 shadow-sm">
                    Premium AI hearing aid for clearer speech
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="premium-card relative flex min-h-[174px] items-center justify-center overflow-hidden p-5">
                    <span className="premium-chip absolute left-3 top-3 text-[11px]">Signia IX</span>
                    <Image
                      src="/images/products/signia/pure-chargego-bct-ix.png"
                      alt="Signia Pure Charge and Go BCT IX hearing aid"
                      width={760}
                      height={760}
                      className="max-h-[118px] w-full object-contain drop-shadow-xl"
                    />
                  </div>
                  <div className="premium-card relative flex min-h-[174px] items-center justify-center overflow-hidden p-5">
                    <span className="premium-chip absolute left-3 top-3 text-[11px]">ReSound Vivia</span>
                    <Image
                      src="/images/products/resound/vivia-grey.png"
                      alt="ReSound Vivia premium rechargeable hearing aid"
                      width={760}
                      height={760}
                      className="max-h-[118px] w-full object-contain drop-shadow-xl"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Latest premium hearing aids
              </p>
              <p className="mt-2 text-center text-lg font-semibold text-slate-800">
                Advanced rechargeable devices, discreet styles, fitting, repair, and support
              </p>
            </div>
          </Reveal>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {providerHighlights.map((item, index) => (
            <Reveal key={item.title} delay={0.04 + index * 0.05} className="premium-card p-5">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="premium-prose mt-2 text-sm">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-center font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Our Hearing Care Services
          </h2>
          <p className="premium-prose mx-auto mt-4 max-w-3xl text-center">
            Everything you need for better hearing, from consultation to long-term support.
          </p>
        </Reveal>
        <ServicesExplorer services={services} />
      </section>

      <section id="solutions" className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="premium-section px-6 py-10 sm:px-8">
            <Reveal>
              <h2 className="text-center font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
                Hearing Care Solutions For Every Need
              </h2>
              <p className="premium-prose mx-auto mt-4 max-w-3xl text-center">
                Tailored support for individuals, families, seniors, and working professionals.
              </p>
            </Reveal>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {solutionAreas.map((area, index) => (
                <Reveal key={area.title} delay={index * 0.05} className="premium-card p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{area.title}</h3>
                  <p className="premium-prose mt-2 text-sm">{area.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BrandShowcase items={brands} />

      <section id="rental" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="premium-eyebrow mb-4">Flexible Hearing Aid Rentals</p>
          <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">Rent Hearing Products</h2>
          <p className="premium-prose mx-auto mt-4 max-w-3xl">
            Affordable short-term hearing aid rental plans with fitting, support, and clear terms.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="premium-shell overflow-hidden">
            <Image
              src="/images/services/hearing-aid-trial.jpg"
              alt="Patient trying hearing aids with an audiologist"
              width={1200}
              height={800}
              className="h-72 w-full object-cover sm:h-80"
            />

            <div className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="premium-card-soft p-4 text-center">
                  <p className="text-2xl font-bold text-sky-700">Rs 3,499</p>
                  <p className="mt-1 text-sm text-slate-600">Starting monthly rent</p>
                </div>
                <div className="premium-card-soft p-4 text-center">
                  <p className="text-2xl font-bold text-sky-700">30 Days</p>
                  <p className="mt-1 text-sm text-slate-600">Minimum period</p>
                </div>
                <div className="premium-card-soft p-4 text-center">
                  <p className="text-2xl font-bold text-sky-700">KYC</p>
                  <p className="mt-1 text-sm text-slate-600">ID required</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="premium-chip">Hearing test first</span>
                <span className="premium-chip">Device fitting included</span>
                <span className="premium-chip">Service support available</span>
              </div>

              <div className="mt-6">
                <Link href="/#contact" className="premium-button-primary">
                  Book Rental
                </Link>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Latest hearing aids available for rental
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rentalSpotlightDevices.map((device) => (
                    <div key={device.alt} className="premium-card p-3">
                      <span className="mb-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        Rent Available
                      </span>
                      <Image
                        src={device.src}
                        alt={device.alt}
                        width={400}
                        height={280}
                        className="h-36 w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            {rentalPlans.map((plan) => (
              <article key={plan.title} className="premium-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-semibold text-slate-900">{plan.title}</h3>
                  <span className="premium-chip text-xs">Popular</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-sky-700">{plan.price}</p>
                <p className="mt-2 text-sm text-slate-600">{plan.deposit}</p>
                <p className="mt-1 text-sm text-slate-600">{plan.minPeriod}</p>
                <p className="mt-4 text-sm font-medium text-slate-800">{plan.bestFor}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-600">
                  {plan.includes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="premium-card-soft mt-8 p-6 sm:p-8">
          <h3 className="text-2xl font-semibold text-slate-900">Terms & Conditions</h3>
          <ul className="premium-prose mt-4 list-disc space-y-3 pl-5 text-sm">
            {rentalTerms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="subscription" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="premium-eyebrow mb-4">Physical Payment Only</p>
            <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              Hearing Care Subscription Plans
            </h2>
            <p className="premium-prose mx-auto mt-4 max-w-3xl">
              Choose a care plan for regular hearing support, fitting reviews, and maintenance.
              Payment is done in physical mode only at the clinic.
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {subscriptionPlans.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.05}>
              <article className="premium-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-semibold text-slate-900">{plan.label}</h3>
                  {plan.badge ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-3xl font-black text-sky-800">Rs {plan.priceInr.toLocaleString("en-IN")}</p>
                <p className="mt-2 text-sm text-slate-500">Payment mode: physical only</p>

                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                  {plan.coverage.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>

                <Link href="/#contact" className="premium-button-primary mt-6">
                  Enquire in Clinic
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="premium-card-soft mt-8 p-6">
          <h3 className="text-2xl font-semibold text-slate-900">Plan Terms</h3>
          <ul className="premium-prose mt-4 list-disc space-y-3 pl-5 text-sm">
            {subscriptionTerms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="hearingtest" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <p className="premium-eyebrow mb-4">Online Hearing Screening</p>
            <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              Check Your Hearing Online
            </h2>
            <p className="premium-prose mx-auto mt-4 max-w-3xl">
              Take a simple hearing self-check, answer tone prompts for each ear, and get a clear
              report with diagnosis suggestions for Audiosen Hearing Care Clinic.
            </p>
          </div>
        </Reveal>

        <div className="mt-8">
          <HearingTest mode="home" />
        </div>
      </section>

      <section id="contact" className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              {contactContent.sectionTitle}
            </h2>
            <p className="premium-prose mx-auto mt-4 max-w-3xl text-center">
              {contactContent.sectionSubtitle}
            </p>
          </Reveal>

          <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
            <Reveal delay={0.08}>
              <Image
                src="/images/contact-hearing-care-clinic.png"
                alt="Audiologist discussing hearing care with a patient in a modern clinic"
                width={920}
                height={600}
                className="premium-card h-auto w-full object-cover object-center"
              />
            </Reveal>
            <Reveal delay={0.12}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
