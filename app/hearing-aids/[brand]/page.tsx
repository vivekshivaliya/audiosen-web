import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogDisclosure } from "@/components/catalog/catalog-disclosure";
import { CatalogModelCard } from "@/components/catalog/catalog-model-card";
import { ContextualEnquiryForm } from "@/components/catalog/contextual-enquiry-form";
import { StructuredData } from "@/components/catalog/structured-data";
import {
  getCatalogModelPath,
} from "@/lib/catalog/repository";
import { getActiveCatalogSnapshot } from "@/lib/catalog/runtime";
import { catalogV1BrandSlugs } from "@/lib/catalog/route-manifest";
import { getSnapshotBrand, getSnapshotModelsByBrand } from "@/lib/catalog/snapshot";

type BrandPageProps = {
  params: Promise<{ brand: string }>;
};

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return catalogV1BrandSlugs.map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { brand: brandSlug } = await params;
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();
  const brand = getSnapshotBrand(snapshot, brandSlug);

  if (!brand) notFound();

  const canonical = `/hearing-aids/${brand.slug}`;
  const social = {
    title: `${brand.name} Hearing-Aid Guides in Dehradun | Audiosen`,
    description: `Explore source-checked ${brand.name} hearing-aid model guides with Audiosen in Dehradun. Availability, price, and suitability are confirmed individually.`,
  };
  return {
    title: social.title,
    description: social.description,
    alternates: { canonical },
    robots: { index: snapshot.mode === "published", follow: true },
    openGraph: {
      ...social,
      url: `https://audiosen.com${canonical}`,
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", ...social },
  };
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand: brandSlug } = await params;
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();
  const brand = getSnapshotBrand(snapshot, brandSlug);

  if (!brand) notFound();

  const models = getSnapshotModelsByBrand(snapshot, brand.slug);
  const pagePath = `/hearing-aids/${brand.slug}`;
  const pageUrl = `https://audiosen.com${pagePath}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${brand.name} hearing-aid model guides`,
        description: brand.summary,
        inLanguage: "en-IN",
        mainEntity: { "@id": `${pageUrl}#models` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
          { "@type": "ListItem", position: 2, name: "Hearing aids", item: "https://audiosen.com/hearing-aids" },
          { "@type": "ListItem", position: 3, name: brand.name, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#models`,
        numberOfItems: models.length,
        itemListElement: models.map((model, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: model.name,
          url: `https://audiosen.com${getCatalogModelPath(model)}`,
        })),
      },
    ],
  };

  return (
    <main>
      <StructuredData data={structuredData} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-teal-800">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/hearing-aids" className="hover:text-teal-800">Hearing aids</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{brand.name}</span>
        </nav>

        <div className="premium-shell px-6 py-10 sm:px-10 lg:py-14">
          <p className="premium-eyebrow">Brand model guide</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
            {brand.name} Hearing-Aid Models
          </h1>
          <p className="premium-prose mt-5 max-w-4xl text-lg">{brand.summary}</p>
          <p className="premium-prose mt-3 max-w-4xl">
            These {models.length} entries are {snapshot.mode === "published"
              ? "Owner-approved database model records"
              : "manufacturer-model guides migrated from Audiosen’s prior catalogue"}. They are
            available for guidance and current-price requests, not as a claim that a device is in stock.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#catalog-enquiry" className="premium-button-primary">Request {brand.name} information</a>
            <Link href="/compare-hearing-aids" className="premium-button-secondary">
              Choose models to compare
            </Link>
            <Link href="/hearing-aids" className="premium-button-secondary">All brands</Link>
          </div>
        </div>

        <div className="mt-6"><CatalogDisclosure mode={snapshot.mode} /></div>
      </section>

      <section aria-labelledby="models-heading" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="premium-eyebrow">Informational entries</p>
            <h2 id="models-heading" className="mt-3 font-display text-4xl font-semibold text-slate-900">{brand.name} model guides</h2>
          </div>
          <span className="premium-chip">{models.length} guides</span>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {models.map((model) => <CatalogModelCard key={model.key} model={model} brand={brand} />)}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">Source and publication state</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Review each model&apos;s cited source</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div className="premium-card p-4">
              <dt className="font-semibold text-slate-900">Catalogue source</dt>
              <dd className="premium-prose mt-1">{brand.source.label}</dd>
            </div>
            <div className="premium-card p-4">
              <dt className="font-semibold text-slate-900">Publication gate</dt>
              <dd className="premium-prose mt-1">{brand.publication.note}</dd>
            </div>
            <div className="premium-card p-4">
              <dt className="font-semibold text-slate-900">Media gate</dt>
              <dd className="premium-prose mt-1">{snapshot.mode === "published" ? "Every exposed product image passed the optimized Blob, source, evidence, rights, primary-selection, and Owner-approval gates." : "Product media is withheld while usage rights remain unconfirmed."}</dd>
            </div>
          </dl>
        </div>
        <ContextualEnquiryForm
          type="product_enquiry"
          service={`${brand.name} hearing-aid information`}
          sourcePath={pagePath}
          context={{ journey: "brand_catalogue", brandSlug: brand.slug }}
          heading={`Ask about ${brand.name} models`}
          submitLabel="Request current model information"
        />
      </section>
    </main>
  );
}
