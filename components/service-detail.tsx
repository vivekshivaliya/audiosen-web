import Link from "next/link";
import { clinicContact } from "@/lib/content";
import type { PublicService } from "@/lib/service-catalog";
import { StructuredData } from "@/lib/structured-data";

export function ServiceDetail({
  service,
  parentLabel,
  parentHref,
  schemaMode = "service",
}: {
  service: PublicService;
  parentLabel: string;
  parentHref: string;
  schemaMode?: "service" | "enquiry";
}) {
  const canonicalPath = service.canonicalPath ?? `${parentHref}/${service.slug}`;
  const schemaName = schemaMode === "enquiry" ? `${service.title} enquiry` : service.title;
  const schemaDescription =
    schemaMode === "enquiry"
      ? `${service.shortDescription} Provider, appointment and service availability are confirmed before booking.`
      : service.shortDescription;
  const whatsappUrl = `https://wa.me/${clinicContact.whatsappE164.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Hello, I would like to enquire about ${service.title}.`,
  )}`;
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `https://audiosen.com${canonicalPath}#service`,
    name: schemaName,
    description: schemaDescription,
    ...(schemaMode === "enquiry"
      ? { serviceType: "Speech and communication support enquiry coordination" }
      : {}),
    url: `https://audiosen.com${canonicalPath}`,
    provider: { "@id": "https://audiosen.com/#organization" },
    areaServed: [
      { "@type": "City", name: "Dehradun" },
      { "@type": "Country", name: "India" },
    ],
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
      {
        "@type": "ListItem",
        position: 2,
        name: parentLabel,
        item: `https://audiosen.com${parentHref}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.title,
        item: `https://audiosen.com${canonicalPath}`,
      },
    ],
  };
  const faqJsonLd = service.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `https://audiosen.com${canonicalPath}#faq`,
        mainEntity: service.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;
  const structuredData = faqJsonLd
    ? [serviceJsonLd, breadcrumbJsonLd, faqJsonLd]
    : [serviceJsonLd, breadcrumbJsonLd];

  return (
    <main>
      <StructuredData data={structuredData} />
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="underline underline-offset-4">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={parentHref} className="underline underline-offset-4">
                {parentLabel}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-slate-900">
              {service.title}
            </li>
          </ol>
        </nav>

        <div className="grid overflow-hidden rounded-[2rem] border border-teal-900/10 bg-[linear-gradient(135deg,#082f3c,#075d61_55%,#1c7772)] text-white shadow-[0_40px_100px_-55px_rgba(4,45,57,0.85)] lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-7 sm:p-10 lg:p-14">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-200">
              Professional care pathway
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">
              {service.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-teal-50/90">
              {service.introduction}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/book-consultation?service=${encodeURIComponent(service.slug)}`}
                className="premium-button-primary border-white bg-white text-teal-950 hover:bg-teal-50"
              >
                {service.bookingLabel}
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="premium-button-secondary border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
          <aside className="m-5 rounded-[1.5rem] border border-white/15 bg-white/10 p-6 backdrop-blur sm:m-8 sm:p-8 lg:self-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-teal-200">
              Who this is for
            </p>
            <p className="mt-3 text-lg leading-8 text-white">{service.audience}</p>
            <p className="mt-6 border-t border-white/15 pt-5 text-sm leading-7 text-teal-50/80">
              Availability, provider, appointment location and any commercial terms are confirmed
              before a booking is accepted.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 sm:p-9">
          <p className="premium-eyebrow">Potential benefits</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-slate-950">
            Care built around a clear next step
          </h2>
          <ul className="mt-7 grid gap-4">
            {service.benefits.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-slate-700">
                <span aria-hidden="true" className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-100 font-bold text-teal-800">
                  ✓
                </span>
                <span className="leading-7">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 sm:p-9">
          <p className="premium-eyebrow">What to expect</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-slate-950">
            A transparent care process
          </h2>
          <ol className="mt-7 grid gap-4">
            {service.process.map((step, index) => (
              <li key={step} className="flex gap-4 text-slate-700">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-950 text-xs font-extrabold text-white">
                  {index + 1}
                </span>
                <span className="leading-7">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {service.faqs.length ? (
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-4xl font-semibold text-slate-950">
            Common questions
          </h2>
          <div className="mt-8 grid gap-3">
            {service.faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-slate-200 bg-white p-5 open:border-teal-300">
                <summary className="min-h-11 cursor-pointer font-bold text-slate-900">
                  {faq.question}
                </summary>
                <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-teal-950 px-7 py-10 text-center text-white sm:px-10">
          <h2 className="font-display text-4xl font-semibold">Ready to discuss the right next step?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-teal-100">
            Send a request without placing sensitive health details in the page URL.
          </p>
          <Link href={`/book-consultation?service=${encodeURIComponent(service.slug)}`} className="premium-button-primary mt-7 border-white bg-white text-teal-950">
            {service.bookingLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
