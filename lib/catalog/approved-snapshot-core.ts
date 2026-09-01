import { ProductStatus } from "@prisma/client";
import {
  evaluateBrandPublicationGate,
  evaluateProductPublicationGate,
  type ProductMediaGateInput,
} from "@/lib/admin/catalog-gates";
import {
  catalogV1BrandSlugs,
  isV1CatalogModelPath,
} from "@/lib/catalog/route-manifest";
import {
  catalogDeviceStyles,
  catalogFeatureKeys,
  type CatalogBrand,
  type CatalogBrandSlug,
  type CatalogDeviceStyle,
  type CatalogFeatureKey,
  type CatalogFeatureRecord,
  type CatalogModel,
  type CatalogSnapshot,
  type TriState,
} from "@/lib/catalog/types";

export type ApprovedCatalogDatabaseMedia = ProductMediaGateInput & Readonly<{
  hearingAidId: string;
}>;

export type ApprovedCatalogDatabaseProduct = Readonly<{
  id: string;
  slug: string;
  modelName: string;
  style: string | null;
  summary: string | null;
  rechargeable: boolean | null;
  bluetooth: boolean | null;
  streaming: boolean | null;
  features: unknown;
  status: ProductStatus;
  isFeatured: boolean;
  sortOrder: number;
  sourceUrl: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  media: readonly ApprovedCatalogDatabaseMedia[];
}>;

export type ApprovedCatalogDatabaseBrand = Readonly<{
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  sortOrder: number;
  sourceUrl: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  hearingAids: readonly ApprovedCatalogDatabaseProduct[];
}>;

export type ApprovedCatalogMediaAsset = Readonly<{
  id: string;
  storageKey: string;
  contentType: "image/webp" | "image/avif";
}>;

export type ApprovedCatalogSnapshot = CatalogSnapshot & Readonly<{
  mode: "published";
  mediaAssets: readonly ApprovedCatalogMediaAsset[];
}>;

function exactTriState(value: unknown): TriState {
  return value === "yes" || value === "no" || value === "unknown" ? value : "unknown";
}

function booleanTriState(value: boolean | null): TriState {
  return value === true ? "yes" : value === false ? "no" : "unknown";
}

function mergeTriState(values: readonly TriState[]): TriState {
  const known = new Set(values.filter((value) => value !== "unknown"));
  return known.size === 1 ? Array.from(known)[0] : "unknown";
}

function featureObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function mapApprovedCatalogFeatures({
  rechargeable,
  bluetooth,
  streaming,
  features,
}: Pick<
  ApprovedCatalogDatabaseProduct,
  "rechargeable" | "bluetooth" | "streaming" | "features"
>): CatalogFeatureRecord {
  const raw = featureObject(features);
  const result = Object.fromEntries(
    catalogFeatureKeys.map((key) => [key, exactTriState(raw[key])]),
  ) as CatalogFeatureRecord;
  result.rechargeable = mergeTriState([
    booleanTriState(rechargeable),
    exactTriState(raw.rechargeable),
  ]);
  result.bluetoothStreaming = mergeTriState([
    booleanTriState(bluetooth),
    booleanTriState(streaming),
    exactTriState(raw.bluetoothStreaming),
  ]);
  return result;
}

function safeStyle(value: string | null): CatalogDeviceStyle {
  return value && (catalogDeviceStyles as readonly string[]).includes(value)
    ? (value as CatalogDeviceStyle)
    : "various";
}

function checkedDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function mapBrand(brand: ApprovedCatalogDatabaseBrand): CatalogBrand {
  const slug = brand.slug as CatalogBrandSlug;
  return {
    slug,
    name: brand.name,
    summary:
      brand.description?.trim() ||
      `Browse Owner-approved ${brand.name} model records and request current information.`,
    logoPath: "",
    publication: {
      status: "owner-approved",
      note: "The database publication gate passed. This does not claim stock, price, warranty, offer, trial, or personal suitability.",
    },
    source: {
      kind: "manufacturer",
      label: `Owner-confirmed source for ${brand.name}`,
      url: brand.sourceUrl ?? undefined,
      checkedAt: brand.verifiedAt ? checkedDate(brand.verifiedAt) : undefined,
    },
    mediaRights: {
      rightsStatus: "pending",
      publicUseApproved: false,
      rightsNote: "No brand-logo media approval is inferred from product-media approval.",
    },
  };
}

function mapProduct(
  product: ApprovedCatalogDatabaseProduct,
  brand: ApprovedCatalogDatabaseBrand,
  primary: ApprovedCatalogDatabaseMedia,
): CatalogModel {
  const brandSlug = brand.slug as CatalogBrandSlug;
  return {
    key: `${brandSlug}~${product.slug}`,
    slug: product.slug,
    brandSlug,
    name: product.modelName,
    style: safeStyle(product.style),
    summary:
      product.summary?.trim() ||
      `${brand.name} ${product.modelName} is listed for current-information enquiries.`,
    isFeatured: product.isFeatured,
    features: mapApprovedCatalogFeatures(product),
    publication: {
      status: "owner-approved",
      note: "Owner-approved database record. Publication does not establish stock, price, warranty, offer, trial, or personal suitability.",
    },
    verification: {
      status: "owner-source-confirmed",
      checkedAt: product.verifiedAt ? checkedDate(product.verifiedAt) : undefined,
      note: "An Owner explicitly confirmed the stored record against the cited source.",
    },
    source: {
      kind: "manufacturer",
      label: `Owner-confirmed source for ${brand.name} ${product.modelName}`,
      url: product.sourceUrl ?? undefined,
      checkedAt: product.verifiedAt ? checkedDate(product.verifiedAt) : undefined,
    },
    media: {
      assetPath: `/catalog-media/${primary.id}`,
      alt: primary.altText,
      rightsStatus: "cleared",
      publicUseApproved: true,
      rightsNote: `Commercial-use evidence and Owner approval were recorded${
        primary.rightsApprovedAt ? ` on ${checkedDate(primary.rightsApprovedAt)}` : ""
      }.`,
    },
  };
}

export function buildApprovedCatalogSnapshot(
  input: readonly ApprovedCatalogDatabaseBrand[],
): ApprovedCatalogSnapshot | null {
  const targetBrands = catalogV1BrandSlugs.map((slug) =>
    input.filter((brand) => brand.slug === slug),
  );
  if (targetBrands.some((matches) => matches.length !== 1)) return null;

  const brands: CatalogBrand[] = [];
  const models: CatalogModel[] = [];
  const mediaAssets: ApprovedCatalogMediaAsset[] = [];
  const modelKeys = new Set<string>();

  for (const matches of targetBrands) {
    const brand = matches[0];
    if (!brand.isPublished) return null;

    const gatePassingProducts = brand.hearingAids
      .filter((product) => product.status === ProductStatus.PUBLISHED)
      .filter((product) => isV1CatalogModelPath(brand.slug, product.slug))
      .filter((product) => evaluateProductPublicationGate(product).ready)
      .sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured) || left.sortOrder - right.sortOrder || left.modelName.localeCompare(right.modelName));
    const brandGate = evaluateBrandPublicationGate(brand, gatePassingProducts.length);
    if (!brandGate.ready) return null;

    brands.push(mapBrand(brand));
    for (const product of gatePassingProducts) {
      const primary = product.media.find((media) => media.isPrimary);
      if (!primary || (primary.contentType !== "image/webp" && primary.contentType !== "image/avif")) {
        return null;
      }
      const key = `${brand.slug}~${product.slug}`;
      if (modelKeys.has(key)) return null;
      modelKeys.add(key);
      models.push(mapProduct(product, brand, primary));
      mediaAssets.push({
        id: primary.id,
        storageKey: primary.storageKey,
        contentType: primary.contentType,
      });
    }
  }

  return {
    mode: "published",
    brands,
    models: models.sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured) || left.name.localeCompare(right.name)),
    mediaAssets,
  };
}

export function approvedCatalogFeatureKeys(): readonly CatalogFeatureKey[] {
  return catalogFeatureKeys;
}
