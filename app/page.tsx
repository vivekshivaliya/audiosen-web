import Image from "next/image";
import Link from "next/link";
import { BrandShowcase } from "@/components/brand-showcase";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import {
  brands,
  contactContent,
  heroContent,
  providerHighlights,
  services,
  solutionAreas,
  rentalPlans,
  rentalTerms,
  subscriptionPlans,
} from "@/lib/content";

export default function HomePage() {
  return (
    <main>
      <section id="home" className="mx-auto w-full max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-10 shadow-[0_24px_55px_-34px_rgba(8,68,119,0.55)] backdrop-blur sm:px-10 lg:grid-cols-2 lg:py-14">
          <Reveal>
            <div>
              <p className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold tracking-wide text-sky-800">
                Hearing Care Services & Hearing Aid Solutions
              </p>
              <h1 className="font-display text-5xl leading-tight text-slate-900 sm:text-6xl">
                {heroContent.title}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                {heroContent.subtitle}
              </p>
              <div className="mt-6 inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                {heroContent.sideNote}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={heroContent.ctaHref}
                  className="inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  {heroContent.ctaLabel}
                </Link>
                <Link
                  href="#brands"
                  className="inline-flex rounded-full border border-sky-700 px-6 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-700 hover:text-white"
                >
                  Explore Hearing Aids
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="glass-panel rounded-[1.75rem] p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-white p-6 shadow-[0_24px_50px_-36px_rgba(8,68,119,0.65)]">
                  <span className="absolute left-4 top-4 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                    Phonak Infinio
                  </span>
                  <Image
                    src="/images/products/phonak/audeo-sphere-infinio.png"
                    alt="Phonak Audéo Sphere Infinio premium hearing aid"
                    width={900}
                    height={900}
                    className="max-h-[280px] w-full object-contain drop-shadow-2xl"
                    priority
                  />
                  <p className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/85 px-3 py-2 text-center text-sm font-semibold text-slate-800 shadow-sm">
                    Premium AI hearing aid for clearer speech
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="relative flex min-h-[174px] items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(8,68,119,0.5)]">
                    <span className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      Signia IX
                    </span>
                    <Image
                      src="/images/products/signia/pure-chargego-bct-ix.png"
                      alt="Signia Pure Charge&Go BCT IX hearing aid"
                      width={760}
                      height={760}
                      className="max-h-[118px] w-full object-contain drop-shadow-xl"
                    />
                  </div>
                  <div className="relative flex min-h-[174px] items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(8,68,119,0.5)]">
                    <span className="absolute left-3 top-3 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      ReSound Vivia
                    </span>
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
            <Reveal
              key={item.title}
              delay={0.04 + index * 0.05}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-30px_rgba(8,68,119,0.28)]"
            >
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-center font-display text-4xl text-slate-900 sm:text-5xl">
            Our Hearing Care Services
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-slate-600">
            Everything you need for better hearing, from consultation to long-term support.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.title} delay={index * 0.05}>
              <article className="surface-card h-full rounded-[1.5rem] p-6">
                <h3 className="text-xl font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{service.description}</p>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-600">
                  {service.points.map((point) => (
                    <li key={point}>• {point}</li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="solutions" className="bg-[#f3f8fc] py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-4xl text-slate-900 sm:text-5xl">
              Hearing Care Solutions For Every Need
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-slate-600">
              Tailored support for individuals, families, seniors, and working professionals.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {solutionAreas.map((area, index) => (
              <Reveal
                key={area.title}
                delay={index * 0.05}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-30px_rgba(8,68,119,0.3)]"
              >
                <h3 className="text-lg font-semibold text-slate-900">{area.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{area.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BrandShowcase items={brands} />

      <section id="rental" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
  <div className="mb-8 text-center">
    <p className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold tracking-wide text-sky-800">
      Flexible Hearing Aid Rentals
    </p>
    <h2 className="font-display text-4xl text-slate-900 sm:text-5xl">
      Rent Hearing Products
    </h2>
    <p className="mx-auto mt-4 max-w-3xl text-slate-600">
      Affordable short-term hearing aid rental plans with fitting, support, and clear terms.
    </p>
  </div>

  <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_42px_-30px_rgba(8,68,119,0.35)]">
      <Image
        src="/images/services/hearing-aid-trial.jpg"
        alt="Patient trying hearing aids with an audiologist"
        width={1200}
        height={800}
        className="h-72 w-full object-cover sm:h-80"
      />

      <div className="p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-sky-50 p-4 text-center">
            <p className="text-2xl font-bold text-sky-700">₹3,499</p>
            <p className="mt-1 text-sm text-slate-600">Starting monthly rent</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4 text-center">
            <p className="text-2xl font-bold text-sky-700">30 Days</p>
            <p className="mt-1 text-sm text-slate-600">Minimum period</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4 text-center">
            <p className="text-2xl font-bold text-sky-700">KYC</p>
            <p className="mt-1 text-sm text-slate-600">ID required</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
            Hearing test first
          </span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
            Device fitting included
          </span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
            Service support available
          </span>
        </div>

     <div className="mt-6">
  <Link
    href="/#contact"
    className="inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
  >
    Book Rental
  </Link>
</div>

<div className="mt-6">
  <p className="mb-3 text-sm font-semibold text-slate-700">
    Latest hearing aids available for rental
  </p>

  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="mb-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
        Rent Available
      </span>
      <Image
        src="/images/products/official/phonak-lumity-l90.png"
        alt="Phonak Lumity L90 hearing aid"
        width={400}
        height={280}
        className="h-36 w-full object-contain"
      />
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="mb-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
        Rent Available
      </span>
      <Image
        src="/images/products/official/signia-charge-and-go-ix.jpg"
        alt="Signia Charge and Go IX hearing aid"
        width={400}
        height={280}
        className="h-36 w-full object-contain"
      />
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="mb-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
        Rent Available
      </span>
      <Image
        src="/images/products/official/starkey-genesis-ai.png"
        alt="Starkey Genesis AI hearing aid"
        width={400}
        height={280}
        className="h-36 w-full object-contain"
      />
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="mb-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
        Rent Available
      </span>
      <Image
        src="/images/products/official/phonak-audeo-paradise.png"
        alt="Phonak Audéo Paradise hearing aid"
        width={400}
        height={280}
        className="h-36 w-full object-contain"
      />
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="mb-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
        Rent Available
      </span>
      <Image
        src="/images/products/official/resound-nexia.png"
        alt="ReSound Nexia hearing aid"
        width={400}
        height={280}
        className="h-36 w-full object-contain"
      />
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <span className="mb-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
        Rent Available
      </span>
      <Image
        src="/images/products/official/widex-moment.png"
        alt="Widex Moment hearing aid"
        width={400}
        height={280}
        className="h-36 w-full object-contain"
      />
    </div>
  </div>
</div>
      </div>
    </div>

    <div className="grid gap-5">
      {rentalPlans.map((plan) => (
        <article
          key={plan.title}
          className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(8,68,119,0.3)]"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-semibold text-slate-900">{plan.title}</h3>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Popular
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold text-sky-700">{plan.price}</p>
          <p className="mt-2 text-sm text-slate-600">{plan.deposit}</p>
          <p className="mt-1 text-sm text-slate-600">{plan.minPeriod}</p>
          <p className="mt-4 text-sm font-medium text-slate-800">{plan.bestFor}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {plan.includes.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </div>

  <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 sm:p-8">
    <h3 className="text-2xl font-semibold text-slate-900">Terms & Conditions</h3>
    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
      {rentalTerms.map((term) => (
        <li key={term}>• {term}</li>
      ))}
    </ul>
  </div>
</section>

<section id="subscription" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
  <Reveal>
    <div className="text-center">
      <p className="mb-4 inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-semibold tracking-wide text-sky-800">
        Physical Payment Only
      </p>
      <h2 className="font-display text-4xl text-slate-900 sm:text-5xl">
        Hearing Care Subscription Plans
      </h2>
      <p className="mx-auto mt-4 max-w-3xl text-slate-600">
        Choose a care plan for regular hearing support, fitting reviews, and maintenance.
        Payment is done in physical mode only at the clinic.
      </p>
    </div>
  </Reveal>

  <div className="mt-8 grid gap-5 md:grid-cols-3">
    {subscriptionPlans.map((plan, index) => (
      <Reveal key={plan.id} delay={index * 0.05}>
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_18px_42px_-30px_rgba(8,68,119,0.3)]">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-semibold text-slate-900">{plan.label}</h3>
            {plan.badge ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                {plan.badge}
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-3xl font-black text-sky-800">
            Rs {plan.priceInr.toLocaleString("en-IN")}
          </p>

          <p className="mt-2 text-sm text-slate-500">Payment mode: physical only</p>

          <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-700">
            {plan.coverage.map((point) => (
              <li key={point}>• {point}</li>
            ))}
          </ul>

          <Link
            href="/#contact"
            className="mt-6 inline-flex rounded-full bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Enquire in Clinic
          </Link>
        </article>
      </Reveal>
    ))}
  </div>

  <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
    <h3 className="text-2xl font-semibold text-slate-900">Plan Terms</h3>
    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
      <li>• Subscription is available only after hearing consultation.</li>
      <li>• Physical payment only at the clinic.</li>
      <li>• No online checkout or payment gateway is shown on the website.</li>
      <li>• Plan benefits apply only during the active plan period.</li>
      <li>• Extra repair parts, accessories, or major servicing can be billed separately.</li>
    </ul>
  </div>
</section>


      

      <section id="contact" className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-4xl text-slate-900 sm:text-5xl">
              {contactContent.sectionTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-slate-600">
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
  className="h-auto w-full rounded-[1.5rem] border border-sky-100 object-cover object-center shadow-[0_20px_40px_-26px_rgba(8,68,119,0.55)]"
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
