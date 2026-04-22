import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/reveal";
import { TrackedLink } from "@/components/tracked-link";
import type { AdLandingPage } from "@/lib/ad-landing-pages";
import { footerContact } from "@/lib/content";

type AdLandingPageViewProps = {
  page: AdLandingPage;
};

export function AdLandingPageView({ page }: AdLandingPageViewProps) {
  const phoneHref = `tel:${footerContact.phone.replace(/\s/g, "")}`;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <Reveal>
        <section className="relative overflow-hidden rounded-[2.25rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,#dff4ff_0%,#ffffff_38%,#eefdf8_100%)] p-6 shadow-[0_28px_70px_-40px_rgba(8,68,119,0.65)] sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-200/35 blur-3xl" />
          <div className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-800">
                {page.eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl font-display text-5xl leading-tight text-slate-950 sm:text-6xl">
                {page.headline}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg">
                {page.subheadline}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#lead-form"
                  className="inline-flex rounded-full bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(8,68,119,0.85)] transition hover:bg-sky-800"
                >
                  {page.primaryCta}
                </Link>
                <TrackedLink
                  href={phoneHref}
                  eventName="phone_click"
                  eventLabel={page.slug}
                  className="inline-flex rounded-full border border-sky-700 bg-white px-6 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
                >
                  Call {footerContact.phone}
                </TrackedLink>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {page.proofPoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/70 bg-white/75 p-4 text-sm font-medium leading-relaxed text-slate-700 shadow-sm"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white bg-white/85 p-5 shadow-[0_24px_55px_-36px_rgba(8,68,119,0.65)]">
              <Image
                src={page.image}
                alt={page.imageAlt}
                width={1000}
                height={760}
                priority
                className="h-72 w-full rounded-[1.35rem] border border-slate-100 bg-white object-contain p-5 sm:h-96"
              />
              <p className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">
                Local Dehradun support for consultation, fitting, repair, and follow-up care.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal delay={0.05}>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_-32px_rgba(8,68,119,0.4)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
              What We Help With
            </p>
            <h2 className="mt-3 font-display text-4xl text-slate-900">Built for high-intent care.</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-slate-700 sm:text-base">
              {page.services.map((service) => (
                <li key={service} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.09}>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_-32px_rgba(8,68,119,0.4)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
              Simple Next Steps
            </p>
            <h2 className="mt-3 font-display text-4xl text-slate-900">From enquiry to guidance.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {page.process.map((step, index) => (
                <div key={step} className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section id="lead-form" className="mt-10 grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal delay={0.04}>
          <div className="rounded-[2rem] border border-slate-200 bg-[#071128] p-6 text-white shadow-[0_20px_48px_-32px_rgba(8,68,119,0.5)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-200">
              Book With Audiosen
            </p>
            <h2 className="mt-3 font-display text-4xl">Ready to get guidance?</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200 sm:text-base">
              Send your details and Audiosen will help you choose the right next step for hearing
              consultation, hearing aid support, rental, repair, or follow-up care.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-200">
              <p>Phone: {footerContact.phone}</p>
              <p>Email: {footerContact.gmail}</p>
              <p>Location: {footerContact.location}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {page.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-slate-100"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <ContactForm />
        </Reveal>
      </section>

      <section className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_-32px_rgba(8,68,119,0.35)] sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-700">
          Common Questions
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {page.faqs.map((faq) => (
            <article key={faq.question} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">{faq.question}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
