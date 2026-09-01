import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import {
  brandIdentity,
  callHref,
  clinicContact,
  dehradunClinicJsonLd,
  whatsappHref,
} from "@/lib/content";
import type { LocalServicePageContent } from "@/lib/local-service-pages";
import { localServicePageList } from "@/lib/local-service-pages";
import { StructuredData } from "@/lib/structured-data";

type LocalServicePageProps = {
  content: LocalServicePageContent;
};

export function LocalServicePage({ content }: LocalServicePageProps) {
  const pageUrl = `https://audiosen.com/${content.slug}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: content.title,
      description: content.metaDescription,
      url: pageUrl,
      areaServed: {
        "@type": "City",
        name: "Dehradun",
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
          name: content.title,
          item: pageUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  const relatedPages = localServicePageList.filter((page) => page.slug !== content.slug);

  return (
    <main>
      <StructuredData data={[dehradunClinicJsonLd, ...structuredData]} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-14 sm:px-6 lg:px-8">
        <div className="premium-shell grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div>
            <p className="premium-eyebrow mb-4">{content.eyebrow}</p>
            <h1 className="font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
              {content.title}
            </h1>
            <p className="premium-prose mt-5 max-w-2xl text-lg">{content.introduction}</p>

            <div className="mt-6 rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-sky-800">
                In-person service enquiries
              </p>
              <p className="mt-2 text-base font-semibold leading-relaxed text-slate-900">
                {brandIdentity.organizationName} confirms the service location directly with each booking.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Please call or message before travelling. No walk-in address or opening hours are
                published until those details are verified.
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
                Ask on WhatsApp
              </a>
            </div>
          </div>

          <Image
            src={content.image}
            alt={content.imageAlt}
            width={1200}
            height={800}
            priority
            className="premium-card h-80 w-full object-cover object-center"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="premium-eyebrow mb-4">What to consider</p>
          <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Clear information before you decide
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.highlights.map((highlight) => (
            <article key={highlight.title} className="premium-card p-5">
              <h3 className="text-xl font-semibold text-slate-900">{highlight.title}</h3>
              <p className="premium-prose mt-2 text-sm">{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="premium-section px-6 py-10 sm:px-8">
            <p className="premium-eyebrow mb-4">How it works</p>
            <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
              A practical four-step process
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-4">
              {content.steps.map((step, index) => (
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

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="premium-eyebrow mb-4">Book or ask a question</p>
          <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Get the right next step
          </h2>
          <p className="premium-prose mt-4">
            Tell Audiosen what you are experiencing and which service you need. The team will
            confirm appointment availability and explain what to bring.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            Website information is educational and does not replace diagnosis, emergency care, or
            advice from a qualified medical professional.
          </div>
        </div>
        <ContactForm />
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="premium-eyebrow mb-4">Common questions</p>
          <h2 className="font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Before you contact the clinic
          </h2>
        </div>
        <div className="mt-8 grid gap-4">
          {content.faqs.map((faq) => (
            <article key={faq.question} className="premium-card p-6">
              <h3 className="text-xl font-semibold text-slate-900">{faq.question}</h3>
              <p className="premium-prose mt-2">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="premium-shell p-6 sm:p-8">
          <h2 className="font-display text-3xl font-semibold text-slate-900">
            Related hearing-care services
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/hearing-aids-dehradun" className="premium-card p-4 font-semibold text-sky-800">
              Hearing aids in Dehradun
            </Link>
            {relatedPages.map((page) => (
              <Link
                key={page.slug}
                href={
                  page.slug === "home-hearing-care-dehradun"
                    ? "/home-hearing-care"
                    : `/${page.slug}`
                }
                className="premium-card p-4 font-semibold text-sky-800"
              >
                {page.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
