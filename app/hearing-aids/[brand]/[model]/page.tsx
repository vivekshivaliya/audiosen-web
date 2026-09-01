import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CatalogDisclosure } from "@/components/catalog/catalog-disclosure";
import { ModelViewAnalytics } from "@/components/catalog/catalog-analytics";
import { CatalogModelCard } from "@/components/catalog/catalog-model-card";
import { ContextualEnquiryForm } from "@/components/catalog/contextual-enquiry-form";
import { StructuredData } from "@/components/catalog/structured-data";
import {
  catalogFeatureLabels,
  catalogStyleLabels,
  getCatalogModelPath,
  triStateLabels,
} from "@/lib/catalog/repository";
import { getActiveCatalogSnapshot } from "@/lib/catalog/runtime";
import { catalogV1ModelPaths } from "@/lib/catalog/route-manifest";
import {
  getSnapshotBrand,
  getSnapshotModel,
  getSnapshotModelFullName,
  getSnapshotModelsByBrand,
} from "@/lib/catalog/snapshot";

type ModelPageProps = {
  params: Promise<{ brand: string; model: string }>;
};

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return catalogV1ModelPaths.map((path) => {
    const [brand, model] = path.split("/");
    return { brand, model };
  });
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { brand: brandSlug, model: modelSlug } = await params;
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();
  const brand = getSnapshotBrand(snapshot, brandSlug);
  const model = getSnapshotModel(snapshot, brandSlug, modelSlug);

  if (!brand || !model) {
    notFound();
  }

  const canonical = getCatalogModelPath(model);
  const fullName = getSnapshotModelFullName(snapshot, model);
  const social = {
    title: `${fullName} Model Guide | Audiosen`,
    description: "An informational model guide with explicit verification and availability boundaries.",
  };
  return {
    title: social.title,
    description: `${model.summary} Review the ${snapshot.mode === "published" ? "Owner-confirmed database" : "editorial preview"} feature record and request current manufacturer, availability, and pricing information.`,
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

export default async function ModelPage({ params }: ModelPageProps) {
  const { brand: brandSlug, model: modelSlug } = await params;
  const snapshot = await getActiveCatalogSnapshot();
  if (!snapshot) notFound();
  const brand = getSnapshotBrand(snapshot, brandSlug);
  const model = getSnapshotModel(snapshot, brandSlug, modelSlug);

  if (!brand || !model) notFound();

  const pagePath = getCatalogModelPath(model);
  const pageUrl = `https://audiosen.com${pagePath}`;
  const fullName = getSnapshotModelFullName(snapshot, model);
  const canDisplayMedia = model.media.publicUseApproved && model.media.rightsStatus === "cleared";
  const relatedModels = getSnapshotModelsByBrand(snapshot, brand.slug)
    .filter((entry) => entry.key !== model.key)
    .slice(0, 3);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${fullName} model guide`,
        description: model.summary,
        inLanguage: "en-IN",
        about: { "@id": `${pageUrl}#model` },
      },
      {
        "@type": "Product",
        "@id": `${pageUrl}#model`,
        name: model.name,
        model: model.name,
        brand: { "@type": "Brand", name: brand.name },
        category: catalogStyleLabels[model.style],
        description: model.summary,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://audiosen.com/" },
          { "@type": "ListItem", position: 2, name: "Hearing aids", item: "https://audiosen.com/hearing-aids" },
          { "@type": "ListItem", position: 3, name: brand.name, item: `https://audiosen.com/hearing-aids/${brand.slug}` },
          { "@type": "ListItem", position: 4, name: model.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main>
      <StructuredData data={structuredData} />
      <ModelViewAnalytics brandSlug={brand.slug} productSlug={model.slug} />

      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-teal-800">Home</Link>
          <span aria-hidden="true"> / </span>
          <Link href="/hearing-aids" className="hover:text-teal-800">Hearing aids</Link>
          <span aria-hidden="true"> / </span>
          <Link href={`/hearing-aids/${brand.slug}`} className="hover:text-teal-800">{brand.name}</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{model.name}</span>
        </nav>

        <div className="premium-shell grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:py-14">
          <div>
            <p className="premium-eyebrow">{brand.name} model guide</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-slate-900 sm:text-6xl">{model.name}</h1>
            <p className="premium-prose mt-5 max-w-3xl text-lg">{model.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="premium-chip">{catalogStyleLabels[model.style]}</span>
              <span className="premium-chip">{snapshot.mode === "published" ? "Owner-approved record" : "Staged guidance"}</span>
              <span className="premium-chip">
                {model.verification.status === "manufacturer-source-checked" || model.verification.status === "owner-source-confirmed"
                  ? `${model.verification.status === "owner-source-confirmed" ? "Owner-confirmed source" : "Manufacturer source checked"} ${model.verification.checkedAt ?? ""}`.trim()
                  : "Manufacturer-source check pending"}
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#catalog-enquiry" className="premium-button-primary">
                Request current price information
              </a>
              <Link
                href={`/compare-hearing-aids?models=${encodeURIComponent(model.key)}`}
                className="premium-button-secondary"
              >
                Compare this model
              </Link>
            </div>
          </div>

          {canDisplayMedia ? (
            <div className="grid min-h-80 place-items-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <Image
                src={model.media.assetPath}
                alt={model.media.alt}
                unoptimized={model.media.assetPath.startsWith("/catalog-media/")}
                width={960}
                height={720}
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="h-72 w-full object-contain"
              />
            </div>
          ) : (
            <div
              role="img"
              aria-label={`${fullName} product image withheld while media rights are confirmed`}
              className="grid min-h-80 place-items-center rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-teal-50 to-indigo-100 p-8 text-center shadow-sm"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">{brand.name}</span>
                <p className="mt-4 font-display text-4xl font-semibold text-slate-800">{model.name}</p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                  The fallback media reference is not displayed until commercial usage rights are documented.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6"><CatalogDisclosure mode={snapshot.mode} /></div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="premium-section p-6 sm:p-8">
          <p className="premium-eyebrow">Tri-state feature record</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">What the current record says</h2>
          <p className="premium-prose mt-3">
            “Confirmed” below means the cited manufacturer source directly supports that attribute.
            Unknown remains unknown and does not mean the feature is unavailable.
          </p>
          <dl className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {Object.entries(model.features).map(([feature, state]) => (
              <div key={feature} className="grid gap-1 px-4 py-4 sm:grid-cols-[0.9fr_1.1fr] sm:gap-4">
                <dt className="font-semibold text-slate-900">{catalogFeatureLabels[feature as keyof typeof catalogFeatureLabels]}</dt>
                <dd className={state === "yes" ? "text-teal-800" : state === "no" ? "text-rose-800" : "text-slate-600"}>
                  {triStateLabels[state]}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="premium-card p-6 sm:p-8">
          <p className="premium-eyebrow">Evidence gates</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Verification state</h2>
          <dl className="mt-6 grid gap-5 text-sm">
            <div>
              <dt className="font-semibold text-slate-900">Source</dt>
              <dd className="premium-prose mt-1">{model.source.label}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Model verification</dt>
              <dd className="premium-prose mt-1">{model.verification.note}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Publication</dt>
              <dd className="premium-prose mt-1">{model.publication.note}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Product media</dt>
              <dd className="premium-prose mt-1">{model.media.rightsNote}</dd>
            </div>
          </dl>
          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-relaxed text-sky-950">
            A hearing-aid choice should follow appropriate assessment, ear and medical screening
            where indicated, selection, verification, fitting, and follow-up. This page does not
            diagnose hearing loss or establish device suitability.
          </div>
        </aside>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="premium-eyebrow">Model-specific enquiry</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-slate-900">Request current written information</h2>
          <p className="premium-prose mt-4">
            Ask about the exact model identity, current manufacturer specifications, compatibility,
            assessment pathway, availability, and price. A submitted request does not reserve this model.
          </p>
        </div>
        <ContextualEnquiryForm
          type="request_price"
          service={`${fullName} current information and price request`}
          sourcePath={pagePath}
          context={{ journey: "model_detail", brandSlug: brand.slug, modelSlug: model.slug }}
          heading={`Ask about ${fullName}`}
          submitLabel="Request current information"
        />
      </section>

      {relatedModels.length > 0 ? (
        <section aria-labelledby="related-heading" className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="premium-eyebrow">Same brand</p>
              <h2 id="related-heading" className="mt-3 font-display text-4xl font-semibold text-slate-900">Other {brand.name} guides</h2>
            </div>
            <Link href={`/hearing-aids/${brand.slug}`} className="premium-button-secondary">View all {brand.name} guides</Link>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {relatedModels.map((entry) => <CatalogModelCard key={entry.key} model={entry} brand={brand} headingLevel="h3" />)}
          </div>
        </section>
      ) : null}
    </main>
  );
}
