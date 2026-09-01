import Link from "next/link";
import Image from "next/image";
import {
  catalogFeatureLabels,
  catalogStyleLabels,
  getCatalogModelPath,
} from "@/lib/catalog/repository";
import type { CatalogBrand, CatalogModel } from "@/lib/catalog/types";

type CatalogModelCardProps = {
  model: CatalogModel;
  brand: CatalogBrand;
  headingLevel?: "h2" | "h3";
};

export function CatalogModelCard({ model, brand, headingLevel = "h2" }: CatalogModelCardProps) {
  const Heading = headingLevel;
  const canDisplayMedia = model.media.publicUseApproved && model.media.rightsStatus === "cleared";
  const isOwnerApproved = model.publication.status === "owner-approved";
  const listedFeatures = Object.entries(model.features)
    .filter(([, state]) => state === "yes")
    .slice(0, 3) as [keyof typeof catalogFeatureLabels, "yes"][];

  return (
    <article className="premium-card catalog-model-card flex h-full flex-col overflow-hidden p-5">
      {canDisplayMedia ? (
        <div className="grid min-h-44 place-items-center rounded-2xl border border-slate-200 bg-white p-5">
          <Image
            src={model.media.assetPath}
            alt={model.media.alt}
            unoptimized={model.media.assetPath.startsWith("/catalog-media/")}
            width={720}
            height={540}
            sizes="(max-width: 640px) 90vw, (max-width: 1280px) 44vw, 29vw"
            className="h-40 w-full object-contain"
          />
        </div>
      ) : (
        <div
          aria-label={`${model.name} image withheld while media usage rights are confirmed`}
          className="grid min-h-44 place-items-center rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-teal-50 to-indigo-50 p-6 text-center"
          role="img"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">
              {brand.name}
            </span>
            <p className="mt-3 font-display text-3xl font-semibold text-slate-800">{model.name}</p>
            <p className="mt-2 text-xs text-slate-600">Product image pending rights confirmation</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-800">
            {brand.name}
          </p>
          <Heading className="mt-1 text-2xl font-semibold text-slate-900">{model.name}</Heading>
        </div>
        <span className="premium-chip text-xs">{catalogStyleLabels[model.style]}</span>
      </div>

      <p className="premium-prose mt-3 text-sm">{model.summary}</p>

      {listedFeatures.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-600">
            {isOwnerApproved ? "Attributes in the confirmed database record" : "Attributes listed in the legacy record"}
          </p>
          <ul aria-label="Attributes in the current catalog record" className="mt-2 flex flex-wrap gap-2">
            {listedFeatures.map(([feature]) => (
              <li key={feature} className="premium-chip text-xs">
                {catalogFeatureLabels[feature]}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        {isOwnerApproved
          ? "Owner-approved informational listing. Stock, price, and personal suitability still need confirmation."
          : "Informational listing only. Current specifications and availability need confirmation."}
      </p>

      <div className="mt-auto flex flex-wrap gap-3 pt-5">
        <Link href={getCatalogModelPath(model)} className="premium-button-primary">
          View model guide
        </Link>
        <Link
          href={`/compare-hearing-aids?models=${encodeURIComponent(model.key)}`}
          className="premium-button-secondary"
        >
          Add to comparison
        </Link>
      </div>
    </article>
  );
}
