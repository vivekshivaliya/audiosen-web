import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComparePicker } from "@/components/catalog/compare-picker";
import { ContextualEnquiryForm } from "@/components/catalog/contextual-enquiry-form";
import { StructuredData } from "@/components/catalog/structured-data";
import {
  catalogFeatureLabels,
  catalogStyleLabels,
  getCatalogModelPath,
  triStateLabels,
} from "@/lib/catalog/repository";
import { getActiveCatalogSnapshot } from "@/lib/catalog/runtime";
import {
  getSnapshotBrand,
  getSnapshotModelByKey,
  parseSnapshotModelKeys,
} from "@/lib/catalog/snapshot";
import type { CatalogBrand, CatalogModel } from "@/lib/catalog/types";

const pagePath = "/compare-hearing-aids";
const pageUrl = `https://audiosen.com${pagePath}`;

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();
  const social = {
    title: "Compare Hearing-Aid Model Guides | Audiosen",
    description:
      "Build a shareable comparison without assumptions about price, stock, warranty, or personal suitability.",
  };
  return {
    title: social.title,
    description:
      "Compare up to three hearing-aid model guides by style and tri-state attributes, then request current manufacturer information.",
    alternates: { canonical: pagePath },
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

function featureTone(state: "yes" | "no" | "unknown"): string {
  if (state === "yes") return "text-teal-800";
  if (state === "no") return "text-rose-800";
  return "text-slate-600";
}

function verificationLabel(model: CatalogModel): string {
  return model.verification.status === "manufacturer-source-checked" ||
    model.verification.status === "owner-source-confirmed"
    ? `${model.verification.status === "owner-source-confirmed" ? "Owner-confirmed source" : "Manufacturer source checked"} ${model.verification.checkedAt ?? ""}`.trim()
    : "Manufacturer-source check pending";
}

function MobileComparisonCard({ model, brand }: { model: CatalogModel; brand: CatalogBrand }) {
  return (
    <article className="premium-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-800">{brand.name}</p>
      <h3 className="mt-2 text-2xl font-semibold text-slate-900">
        <Link href={getCatalogModelPath(model)} className="hover:text-teal-800">{model.name}</Link>
      </h3>
      <dl className="mt-5 divide-y divide-slate-200 text-sm">
        <div className="py-3">
          <dt className="font-semibold text-slate-900">Physical style</dt>
          <dd className="mt-1 text-slate-600">{catalogStyleLabels[model.style]}</dd>
        </div>
        {Object.entries(model.features).map(([feature, state]) => (
          <div key={feature} className="py-3">
            <dt className="font-semibold text-slate-900">{catalogFeatureLabels[feature as keyof typeof catalogFeatureLabels]}</dt>
            <dd className={`mt-1 ${featureTone(state)}`}>{triStateLabels[state]}</dd>
          </div>
        ))}
        <div className="py-3">
          <dt className="font-semibold text-slate-900">Verification</dt>
          <dd className="mt-1 text-slate-600">{verificationLabel(model)}</dd>
        </div>
      </dl>
    </article>
  );
}

export default async function CompareHearingAidsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();
  const allModels = snapshot.models;
  const params = await searchParams;
  const selectedKeys = parseSnapshotModelKeys(snapshot, params.models);
  const selectedModels = selectedKeys
    .map((key) => getSnapshotModelByKey(snapshot, key))
    .filter((entry): entry is CatalogModel => Boolean(entry));
  const pickerModels = allModels.map((model) => ({
    key: model.key,
    name: model.name,
    brandName: getSnapshotBrand(snapshot, model.brandSlug)?.name ?? model.brandSlug,
  }));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: "Compare hearing-aid model guides",
        description: `A comparison tool for ${snapshot.mode === "published" ? "Owner-confirmed database" : "editorial preview"} model attributes and current-information requests.`,
        inLanguage: "en-IN",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
          { "@type": "ListItem", position: 2, name: "Hearing aids", item: "https://audiosen.com/hearing-aids" },
          { "@type": "ListItem", position: 3, name: "Compare", item: pageUrl },
        ],
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
          <span aria-current="page">Compare</span>
        </nav>

        <div className="premium-shell px-6 py-10 sm:px-10 lg:py-14">
          <p className="premium-eyebrow">Decision organiser</p>
          <h1 className="mt-4 max-w-5xl font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">Compare Up to Three Model Guides</h1>
          <p className="premium-prose mt-5 max-w-4xl text-lg">
            Put source-checked attributes side by side and keep the selection in a shareable URL.
            “Confirmed” means the cited manufacturer source supports the field; unknown does not mean absent.
          </p>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
            This comparison excludes price, stock, warranty, offer eligibility, and suitability
            claims. Ask for current written information before making a decision.
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <ComparePicker
          key={selectedKeys.join("|") || "empty-comparison"}
          models={pickerModels}
          selectedKeys={selectedKeys}
        />
      </section>

      <section aria-labelledby="comparison-heading" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="premium-eyebrow">Side-by-side record</p>
            <h2 id="comparison-heading" className="mt-3 font-display text-4xl font-semibold text-slate-900">Your comparison</h2>
          </div>
          <span className="premium-chip">{selectedModels.length} selected</span>
        </div>

        {selectedModels.length > 0 ? (
          <>
            <div className="mt-7 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <caption className="sr-only">Comparison of selected hearing-aid model guide attributes</caption>
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="w-52 border-b border-slate-200 px-5 py-4 font-semibold text-slate-900">Attribute</th>
                    {selectedModels.map((model) => (
                      <th key={model.key} scope="col" className="border-b border-slate-200 px-5 py-4 align-top">
                        <span className="block text-xs font-bold uppercase tracking-[0.1em] text-teal-800">{getSnapshotBrand(snapshot, model.brandSlug)?.name}</span>
                        <Link href={getCatalogModelPath(model)} className="mt-1 block text-lg font-semibold text-slate-900 hover:text-teal-800">{model.name}</Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" className="border-b border-slate-200 px-5 py-4 font-semibold text-slate-900">Physical style</th>
                    {selectedModels.map((model) => <td key={model.key} className="border-b border-slate-200 px-5 py-4 text-slate-700">{catalogStyleLabels[model.style]}</td>)}
                  </tr>
                  {Object.entries(catalogFeatureLabels).map(([feature, label]) => (
                    <tr key={feature}>
                      <th scope="row" className="border-b border-slate-200 px-5 py-4 font-semibold text-slate-900">{label}</th>
                      {selectedModels.map((model) => {
                        const state = model.features[feature as keyof typeof model.features];
                        return <td key={model.key} className={`border-b border-slate-200 px-5 py-4 ${featureTone(state)}`}>{triStateLabels[state]}</td>;
                      })}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="px-5 py-4 font-semibold text-slate-900">Verification</th>
                    {selectedModels.map((model) => <td key={model.key} className="px-5 py-4 text-slate-600">{verificationLabel(model)}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-7 grid gap-5 md:hidden">
              {selectedModels.map((model) => (
                <MobileComparisonCard
                  key={model.key}
                  model={model}
                  brand={getSnapshotBrand(snapshot, model.brandSlug)!}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="premium-card mt-7 p-8 text-center">
            <h3 className="text-2xl font-semibold text-slate-900">Select one to three models above</h3>
            <p className="premium-prose mt-3">The comparison will appear here and remain encoded in the URL.</p>
          </div>
        )}
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">Comparison follow-up</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Turn the table into better questions</h2>
          <p className="premium-prose mt-4">
            Ask for the current specification sheet, exact variant, compatibility details,
            availability, and written price information for the models you selected.
          </p>
        </div>
        <ContextualEnquiryForm
          type="product_enquiry"
          service="Hearing-aid model comparison guidance"
          sourcePath={pagePath}
          context={{
            journey: "comparison",
            compareSlugs: selectedModels.map((model) => model.slug),
            preferences: {
              compareModelKeys: selectedModels.map((model) => model.key),
            },
          }}
          heading="Ask about this comparison"
          submitLabel="Send comparison enquiry"
        />
      </section>
    </main>
  );
}
