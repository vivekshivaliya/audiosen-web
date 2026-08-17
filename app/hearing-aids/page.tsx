import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { brands } from "@/lib/content";

const pageUrl = "https://audiosen.com/hearing-aids";

function createDeviceId(brandSlug: string, title: string) {
  return `${brandSlug}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const deviceEntries = brands.flatMap((brand) =>
  brand.devices.map((device) => ({
    brand,
    device,
    id: createDeviceId(brand.slug, device.title),
  })),
);

export const metadata: Metadata = {
  title: "Hearing Aids by Brand & Style | Audiosen",
  description:
    "Browse Audiosen's hearing-aid catalogue by brand, model, style, features, and connectivity, then learn what to compare before requesting guidance.",
  alternates: { canonical: "/hearing-aids" },
  openGraph: {
    title: "Explore Hearing Aids by Brand and Style | Audiosen",
    description:
      "Compare visible model information across the Audiosen hearing-aid catalogue without price, stock, or suitability assumptions.",
    url: pageUrl,
    siteName: "Audiosen",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/editorial/modern-hearing-technology-v2.webp",
        alt: "Modern hearing-aid technology presented for comparison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Hearing Aids by Brand and Style | Audiosen",
    description: "Browse hearing-aid models, descriptions, and feature summaries by brand.",
    images: ["/images/editorial/modern-hearing-technology-v2.webp"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: "Hearing Aids by Brand and Style",
      description:
        "A server-rendered catalogue of hearing-aid models, descriptions, and feature summaries grouped by brand.",
      inLanguage: "en-IN",
      isPartOf: { "@id": "https://audiosen.com/#website" },
      about: { "@id": `${pageUrl}#catalogue` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
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
          name: "Hearing Aids",
          item: pageUrl,
        },
      ],
    },
    {
      "@type": "ItemList",
      "@id": `${pageUrl}#catalogue`,
      name: "Audiosen hearing-aid catalogue",
      numberOfItems: deviceEntries.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: deviceEntries.map(({ brand, device, id }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${pageUrl}#${id}`,
        item: {
          "@type": "Thing",
          "@id": `${pageUrl}#${id}`,
          name: device.title,
          alternateName: `${brand.name} ${device.title}`,
          description: device.description,
          image: `https://audiosen.com${device.image}`,
        },
      })),
    },
  ],
};

export default function HearingAidsPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-sky-800">
            Home
          </Link>
          <span aria-hidden="true"> / </span>
          <span>Hearing Aids</span>
        </nav>

        <div className="premium-shell grid items-center gap-9 overflow-hidden px-6 py-10 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div>
            <p className="premium-eyebrow">Audiosen device catalogue</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
              Explore Hearing Aids by Brand and Style
            </h1>
            <p className="premium-prose mt-5 max-w-3xl text-lg">
              Browse every hearing-aid model currently described in the Audiosen catalogue. Each
              card keeps the model name, product description, and listed feature details together
              so you can prepare informed questions before seeking personal guidance.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="premium-chip">{brands.length} brand sections</span>
              <span className="premium-chip">{deviceEntries.length} device records</span>
              <span className="premium-chip">Server-rendered catalogue</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/hearing-aid-types" className="premium-button-primary">
                Compare Hearing-Aid Types
              </Link>
              <Link href="/contact" className="premium-button-secondary">
                Ask a Product Question
              </Link>
            </div>
          </div>

          <Image
            src="/images/editorial/modern-hearing-technology-v2.webp"
            alt="Modern hearing-aid technology presented for comparison"
            width={1200}
            height={800}
            priority
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="premium-card h-80 w-full object-cover object-center sm:h-[30rem]"
          />
        </div>

        <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-950">
          <strong>Catalogue note:</strong> A listing does not confirm current stock, price, discount,
          service coverage, or personal suitability. Specifications can change. Confirm the exact
          device and written terms, and use an appropriate hearing assessment and qualified fitting
          pathway before making a decision.
        </aside>
      </section>

      <section aria-labelledby="brand-index-heading" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="premium-section px-6 py-8 sm:px-8">
          <h2 id="brand-index-heading" className="font-display text-3xl font-semibold text-slate-900">
            Browse by brand
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {brands.map((brand) => (
              <a key={brand.slug} href={`#${brand.slug}`} className="premium-button-secondary">
                {brand.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {brands.map((brand, brandIndex) => (
        <section
          key={brand.slug}
          id={brand.slug}
          aria-labelledby={`${brand.slug}-heading`}
          className="scroll-mt-32 py-14"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={brandIndex % 2 === 0 ? "premium-section px-6 py-10 sm:px-8" : "px-1 py-2"}>
              <header className="grid gap-6 md:grid-cols-[10rem_1fr] md:items-center">
                <div className="flex min-h-20 items-center justify-center rounded-2xl border border-slate-200 bg-white p-5">
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={160}
                    height={64}
                    className="max-h-12 w-auto"
                  />
                </div>
                <div>
                  <p className="premium-eyebrow">Brand catalogue</p>
                  <h2 id={`${brand.slug}-heading`} className="mt-3 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
                    {brand.name} Hearing Aids
                  </h2>
                  <p className="premium-prose mt-3 max-w-4xl">{brand.summary}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{brand.position}</p>
                </div>
              </header>

              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {brand.devices.map((device) => {
                  const deviceId = createDeviceId(brand.slug, device.title);

                  return (
                    <article key={device.title} id={deviceId} className="premium-card flex h-full flex-col overflow-hidden p-5">
                      <div className="grid min-h-56 place-items-center rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5">
                        <Image
                          src={device.image}
                          alt={device.imageAlt}
                          width={720}
                          height={540}
                          sizes="(max-width: 640px) 90vw, (max-width: 1280px) 44vw, 29vw"
                          className="h-48 w-full object-contain"
                        />
                      </div>

                      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                        <h3 className="text-2xl font-semibold text-slate-900">{device.title}</h3>
                        <span className="premium-chip text-xs">{device.badge}</span>
                      </div>
                      <p className="premium-prose mt-3 text-sm">{device.description}</p>
                      <ul aria-label={`${device.title} details`} className="mt-5 grid gap-2 text-sm text-slate-700">
                        {device.details.map((detail) => (
                          <li key={detail} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="premium-shell grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="premium-eyebrow">Choose questions before products</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-slate-900">
              Understand styles and fitting considerations next
            </h2>
            <p className="premium-prose mt-3 max-w-3xl">
              Use the types guide to compare physical styles, handling, charging, connectivity, and
              aftercare questions. Contact Audiosen if you want help preparing for a product discussion.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:max-w-xs">
            <Link href="/hearing-aid-types" className="premium-button-primary">
              Read the Types Guide
            </Link>
            <Link href="/contact" className="premium-button-secondary">
              Contact Audiosen
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
