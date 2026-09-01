import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogDisclosure } from "@/components/catalog/catalog-disclosure";
import { CatalogModelCard } from "@/components/catalog/catalog-model-card";
import { ContextualEnquiryForm } from "@/components/catalog/contextual-enquiry-form";
import { StructuredData } from "@/components/catalog/structured-data";
import {
  catalogStyleLabels,
  getCatalogModelPath,
  isCatalogBrandSlug,
  isCatalogDeviceStyle,
} from "@/lib/catalog/repository";
import { getActiveCatalogSnapshot } from "@/lib/catalog/runtime";
import {
  filterSnapshotModels,
  getSnapshotBrand,
  getSnapshotModelFullName,
} from "@/lib/catalog/snapshot";
import type { CatalogFilterState } from "@/lib/catalog/types";
import { getActivePublicOffer } from "@/lib/offers/public";

const pageUrl = "https://audiosen.com/hearing-aids";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();
  const social = {
    title: "Hearing-Aid Model Guides | Audiosen",
    description:
      "Filter informational model guides and request current product information without assumptions about stock, price, or suitability.",
  };
  return {
    title: "Hearing-Aid Model Guides by Brand & Style | Audiosen",
    description:
      "Browse Audiosen hearing-aid model guides by brand and physical style, organise questions, compare listed attributes, and request current information.",
    alternates: { canonical: "/hearing-aids" },
    robots: { index: snapshot.mode === "published", follow: true },
    openGraph: {
      ...social,
      url: pageUrl,
      siteName: "Audiosen",
      type: "website",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", ...social },
  };
}

export default async function HearingAidsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [snapshot, activeTrial] = await Promise.all([
    getActiveCatalogSnapshot(),
    getActivePublicOffer("hearing-aid-trial"),
  ]);
  if (!snapshot) notFound();
  const catalogModels = snapshot.models;
  const catalogBrands = snapshot.brands;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: "Hearing-aid model guides",
        description:
          "An informational collection of hearing-aid model guides with current details available by enquiry.",
        inLanguage: "en-IN",
        mainEntity: { "@id": `${pageUrl}#models` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
          { "@type": "ListItem", position: 2, name: "Hearing aids", item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#models`,
        numberOfItems: catalogModels.length,
        itemListElement: catalogModels.map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: getSnapshotModelFullName(snapshot, entry),
          url: `https://audiosen.com${getCatalogModelPath(entry)}`,
        })),
      },
    ],
  };
  const params = await searchParams;
  const brandParam = firstParam(params.brand);
  const styleParam = firstParam(params.style);
  const chargingParam = firstParam(params.charging);
  const connectivityParam = firstParam(params.connectivity);
  const query = firstParam(params.q).slice(0, 100);

  const filters: CatalogFilterState = {
    ...(isCatalogBrandSlug(brandParam) ? { brand: brandParam } : {}),
    ...(isCatalogDeviceStyle(styleParam) ? { style: styleParam } : {}),
    ...(chargingParam === "rechargeable" || chargingParam === "unknown"
      ? { charging: chargingParam }
      : {}),
    ...(connectivityParam === "bluetooth" || connectivityParam === "unknown"
      ? { connectivity: connectivityParam }
      : {}),
    ...(query ? { query } : {}),
  };
  const models = filterSnapshotModels(snapshot, filters);

  return (
    <main>
      <StructuredData data={structuredData} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-teal-800">Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">Hearing aids</span>
        </nav>

        <div className="premium-shell px-6 py-10 sm:px-10 lg:py-14">
          <p className="premium-eyebrow">Audiosen model-guide catalogue</p>
          <h1 className="mt-4 max-w-5xl font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">
            Explore Hearing-Aid Models Without Inventory Assumptions
          </h1>
          <p className="premium-prose mt-5 max-w-4xl text-lg">
            Browse {catalogModels.length} {snapshot.mode === "published" ? "Owner-approved" : "staged informational"} entries across {catalogBrands.length} brands.
            Filter only the attributes you want to investigate, compare up to three models, then ask
            for current manufacturer information or a written price discussion.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/find-my-hearing-aid" className="premium-button-primary">Organise my preferences</Link>
            <Link href="/compare-hearing-aids" className="premium-button-secondary">Compare models</Link>
            {activeTrial ? (
              <Link href="/hearing-aid-trial" className="premium-button-secondary">Ask about a trial</Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6"><CatalogDisclosure mode={snapshot.mode} /></div>
      </section>

      <section aria-labelledby="brand-heading" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="premium-section p-6 sm:p-8">
          <h2 id="brand-heading" className="font-display text-3xl font-semibold text-slate-900">Browse brand guides</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {catalogBrands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/hearing-aids/${brand.slug}`}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-teal-600 hover:bg-teal-50"
              >
                <strong className="block text-lg text-slate-900">{brand.name}</strong>
                <span className="mt-1 block text-sm text-slate-600">
                  {catalogModels.filter((model) => model.brandSlug === brand.slug).length} model guides
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog-results" aria-labelledby="catalog-results-heading" className="scroll-mt-32 py-12">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <form method="get" action="/hearing-aids" className="premium-section p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="premium-eyebrow">URL-based filters</p>
                <h2 id="catalog-results-heading" className="mt-3 font-display text-4xl font-semibold text-slate-900">Filter the model guides</h2>
              </div>
              <p className="premium-chip" aria-live="polite">{models.length} {models.length === 1 ? "result" : "results"}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Search
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Brand or model"
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Brand
                <select
                  name="brand"
                  defaultValue={filters.brand ?? ""}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">All brands</option>
                  {catalogBrands.map((brand) => <option key={brand.slug} value={brand.slug}>{brand.name}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Physical style
                <select
                  name="style"
                  defaultValue={filters.style ?? ""}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">All styles</option>
                  {Object.entries(catalogStyleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Charging record
                <select
                  name="charging"
                  defaultValue={filters.charging ?? ""}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">Any record</option>
                  <option value="rechargeable">Rechargeable is listed</option>
                  <option value="unknown">Not confirmed</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Connectivity record
                <select
                  name="connectivity"
                  defaultValue={filters.connectivity ?? ""}
                  className="min-h-12 rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="">Any record</option>
                  <option value="bluetooth">Bluetooth/streaming is listed</option>
                  <option value="unknown">Not confirmed</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" className="premium-button-primary">Apply filters</button>
              <Link href="/hearing-aids#catalog-results" className="premium-button-secondary">Clear filters</Link>
            </div>
          </form>

          {models.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {models.map((model) => (
                <CatalogModelCard
                  key={model.key}
                  model={model}
                  brand={getSnapshotBrand(snapshot, model.brandSlug)!}
                />
              ))}
            </div>
          ) : (
            <div className="premium-card mt-8 p-8 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">No guide matches every filter</h2>
              <p className="premium-prose mt-3">Clear one or more filters. An unknown record is not the same as a feature being unavailable.</p>
              <Link href="/hearing-aids#catalog-results" className="premium-button-primary mt-5">Show all model guides</Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">Current-information request</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Ask before treating a catalogue entry as current</h2>
          <p className="premium-prose mt-4">
            Share the model or physical style you want to investigate. The response should confirm
            the current model identity, applicable specifications, availability, and any written
            commercial terms before you rely on them.
          </p>
        </div>
        <ContextualEnquiryForm
          type="product_enquiry"
          service="Hearing-aid catalogue guidance"
          sourcePath="/hearing-aids"
          context={{
            journey: "catalogue",
            preferences: {
              ...(filters.brand ? { brand: filters.brand } : {}),
              ...(filters.style ? { style: filters.style } : {}),
              ...(filters.charging ? { charging: filters.charging } : {}),
              ...(filters.connectivity ? { connectivity: filters.connectivity } : {}),
              ...(filters.query ? { query: filters.query } : {}),
            },
          }}
          heading="Request model guidance"
          submitLabel="Request current information"
        />
      </section>
    </main>
  );
}
