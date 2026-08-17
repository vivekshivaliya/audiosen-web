import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { callHref, clinicContact, whatsappHref } from "@/lib/content";
import type { SeoLandingPageContent } from "@/lib/seo-landing-pages";

const siteUrl = "https://audiosen.com";

function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function createSeoLandingMetadata(content: SeoLandingPageContent): Metadata {
  const pageUrl = `${siteUrl}/${content.slug}`;

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: `/${content.slug}` },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: pageUrl,
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
      images: [{ url: content.image, alt: content.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle,
      description: content.metaDescription,
      images: [content.image],
    },
  };
}

function buildStructuredData(content: SeoLandingPageContent) {
  const pageUrl = `${siteUrl}/${content.slug}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: content.title,
      description: content.metaDescription,
      inLanguage: "en-IN",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${siteUrl}${content.image}`,
      },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${siteUrl}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: content.title,
          item: pageUrl,
        },
      ],
    },
  ];

  if (content.faqs.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: content.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function SeoLandingPage({ content }: { content: SeoLandingPageContent }) {
  const structuredData = buildStructuredData(content);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-sky-800">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{content.title}</span>
        </nav>

        <div className="premium-shell grid items-center gap-9 overflow-hidden px-6 py-10 sm:px-10 lg:grid-cols-[1.03fr_0.97fr] lg:py-14">
          <div>
            <p className="premium-eyebrow">{content.eyebrow}</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.02] text-slate-900 sm:text-6xl">
              {content.title}
            </h1>
            <p className="premium-prose mt-5 max-w-2xl text-lg">{content.introduction}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {content.chips.map((chip) => (
                <span key={chip} className="premium-chip">
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="premium-button-primary"
              >
                Ask Audiosen on WhatsApp
              </a>
              <Link href="/contact" className="premium-button-secondary">
                Request a Consultation
              </Link>
              <a href={callHref} className="premium-button-secondary">
                Call {clinicContact.primaryCallDisplay}
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-3 shadow-[0_30px_80px_-36px_rgba(8,68,119,0.55)]">
            <Image
              src={content.image}
              alt={content.imageAlt}
              width={1200}
              height={800}
              priority
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="h-[24rem] w-full rounded-[1.55rem] object-cover object-center sm:h-[30rem]"
            />
            <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/80 bg-slate-950/80 p-4 text-white backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                Audiosen · India-wide enquiries
              </p>
              <p className="mt-1 text-sm font-semibold">
                Online guidance and coordination · Verified physical clinic in Dehradun
              </p>
            </div>
          </div>
        </div>

        <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950">
          <strong>Important:</strong> {content.notice}
        </aside>
      </section>

      {content.sections.map((section, sectionIndex) => (
        <section
          key={section.heading}
          className={sectionIndex % 2 === 0 ? "py-14" : "mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8"}
        >
          <div
            className={
              sectionIndex % 2 === 0
                ? "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
                : "premium-section px-6 py-10 sm:px-8"
            }
          >
            <div className={sectionIndex % 2 === 0 ? "premium-section px-6 py-10 sm:px-8" : ""}>
              <p className="premium-eyebrow">{section.eyebrow}</p>
              <h2 className="mt-4 max-w-4xl font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
                {section.heading}
              </h2>
              {section.introduction ? (
                <p className="premium-prose mt-4 max-w-3xl">{section.introduction}</p>
              ) : null}

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {section.items.map((item, itemIndex) => (
                  <article key={item.title} className="premium-card h-full p-6">
                    {section.numbered ? (
                      <span className="premium-chip text-xs">Step {itemIndex + 1}</span>
                    ) : null}
                    <h3 className={`${section.numbered ? "mt-4 " : ""}text-xl font-semibold text-slate-900`}>
                      {item.title}
                    </h3>
                    <p className="premium-prose mt-3 text-sm">{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="premium-eyebrow">Common questions</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Clear answers before the next step
          </h2>
        </div>
        <div className="mt-8 grid gap-4">
          {content.faqs.map((faq) => (
            <article key={faq.question} className="premium-card p-6">
              <h3 className="text-xl font-semibold text-slate-900">{faq.question}</h3>
              <p className="premium-prose mt-3">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {content.sources && content.sources.length > 0 ? (
        <section className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white/75 p-5">
            <h2 className="text-base font-semibold text-slate-900">Authoritative further reading</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              {content.sources.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-950"
                  >
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="premium-shell p-6 sm:p-8">
          <p className="premium-eyebrow">Continue exploring</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">Related Audiosen guides</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {content.relatedLinks.map((link) => (
              <Link key={link.href} href={link.href} className="premium-card p-4 font-semibold text-sky-800">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="premium-section grid gap-6 px-6 py-10 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="premium-eyebrow">Personal guidance</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-slate-900">{content.closingTitle}</h2>
            <p className="premium-prose mt-3 max-w-3xl">{content.closingDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:max-w-xs">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-button-primary"
            >
              WhatsApp Audiosen
            </a>
            <Link href="/contact" className="premium-button-secondary">
              Contact options
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
