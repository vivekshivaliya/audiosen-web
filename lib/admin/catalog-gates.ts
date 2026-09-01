import { MediaRightsStatus } from "@prisma/client";

export const primaryCatalogBrandSlugs = ["phonak", "signia", "widex", "resound"] as const;
export const minimumPublishedProductsPerBrand = 4;

const approvedRightsStatuses = new Set<MediaRightsStatus>([
  MediaRightsStatus.MANUFACTURER_AUTHORIZED,
  MediaRightsStatus.LICENSED,
  MediaRightsStatus.OWNED,
  MediaRightsStatus.PUBLIC_DOMAIN,
]);

export function isApprovedMediaRightsStatus(status: MediaRightsStatus): boolean {
  return approvedRightsStatuses.has(status);
}

export function isDraftReferenceProductMediaKey(storageKey: string): boolean {
  return storageKey.toLowerCase().startsWith("draft-reference/");
}

export type CatalogGateCheck = Readonly<{
  key: string;
  label: string;
  passed: boolean;
}>;

export type ProductMediaGateInput = Readonly<{
  id: string;
  storageKey: string;
  altText: string;
  contentType: string;
  width: number | null;
  height: number | null;
  isPrimary: boolean;
  sourceUrl: string | null;
  rightsStatus: MediaRightsStatus;
  rightsEvidenceUrl: string | null;
  rightsCheckedAt: Date | null;
  rightsApprovedAt: Date | null;
  rightsApprovedBy: string | null;
}>;

export type ProductPublicationGateInput = Readonly<{
  sourceUrl: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  media: readonly ProductMediaGateInput[];
}>;

export type BrandPublicationGateInput = Readonly<{
  sourceUrl: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
}>;

export type CatalogGateResult = Readonly<{
  ready: boolean;
  checks: readonly CatalogGateCheck[];
}>;

function validDate(value: Date | null): boolean {
  return Boolean(value && !Number.isNaN(value.getTime()));
}

export function isConfirmedHttpsUrl(value: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isOwnerIdentity(value: string | null): boolean {
  return Boolean(
    value &&
      value === value.trim().toLowerCase() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  );
}

export function isPublishableProductMediaKey(
  storageKey: string,
  contentType: string,
  width: number | null,
  height: number | null,
): boolean {
  const key = storageKey.trim();
  const forbiddenPrefix = ["draft-reference/", "quarantine/", "clean/", "private/"].some(
    (prefix) => key.toLowerCase().startsWith(prefix),
  );
  const safeBlobKey =
    Boolean(key) &&
    key === storageKey &&
    !forbiddenPrefix &&
    !key.startsWith("/") &&
    !key.includes("\\") &&
    !key.split("/").includes("..") &&
    !/^https?:\/\//i.test(key);
  const optimizedFormat =
    (contentType === "image/webp" && /\.webp$/i.test(key)) ||
    (contentType === "image/avif" && /\.avif$/i.test(key));
  return Boolean(
    safeBlobKey &&
      optimizedFormat &&
      width &&
      width > 0 &&
      height &&
      height > 0,
  );
}

export function evaluateProductMediaGate(media: ProductMediaGateInput): CatalogGateResult {
  const checkedAtValid = validDate(media.rightsCheckedAt);
  const approvedAtValid = validDate(media.rightsApprovedAt);
  const approvalChronologyValid = Boolean(
    checkedAtValid &&
      approvedAtValid &&
      media.rightsCheckedAt &&
      media.rightsApprovedAt &&
      media.rightsApprovedAt >= media.rightsCheckedAt,
  );
  const checks: CatalogGateCheck[] = [
    {
      key: "public_optimized_blob",
      label: "Uploaded public optimized Blob key, dimensions, and format are recorded",
      passed: isPublishableProductMediaKey(
        media.storageKey,
        media.contentType,
        media.width,
        media.height,
      ),
    },
    {
      key: "asset_source",
      label: "Exact HTTPS asset source is recorded",
      passed: isConfirmedHttpsUrl(media.sourceUrl),
    },
    {
      key: "alt_text",
      label: "Accurate alternative text is recorded",
      passed: Boolean(media.altText.trim()),
    },
    {
      key: "rights_status",
      label: "Commercial-use rights status is explicitly approved",
      passed: isApprovedMediaRightsStatus(media.rightsStatus),
    },
    {
      key: "rights_evidence",
      label: "HTTPS rights-evidence location is recorded",
      passed: isConfirmedHttpsUrl(media.rightsEvidenceUrl),
    },
    {
      key: "rights_dates",
      label: "Rights check and approval dates are complete and ordered",
      passed: approvalChronologyValid,
    },
    {
      key: "rights_owner",
      label: "Approving Owner identity is recorded as an exact email",
      passed: isOwnerIdentity(media.rightsApprovedBy),
    },
  ];
  return { ready: checks.every((check) => check.passed), checks };
}

export function evaluateProductPublicationGate(
  product: ProductPublicationGateInput,
): CatalogGateResult {
  const primaryMedia = product.media.filter((media) => media.isPrimary);
  const mediaGates = product.media.map((media) => evaluateProductMediaGate(media));
  const primaryGate = primaryMedia.length === 1
    ? evaluateProductMediaGate(primaryMedia[0])
    : null;
  const checks: CatalogGateCheck[] = [
    {
      key: "product_source",
      label: "Exact HTTPS manufacturer/source URL is confirmed",
      passed: isConfirmedHttpsUrl(product.sourceUrl),
    },
    {
      key: "product_verified_at",
      label: "Source verification date is recorded",
      passed: validDate(product.verifiedAt),
    },
    {
      key: "product_verified_by",
      label: "Verifying Owner identity is recorded as an exact email",
      passed: isOwnerIdentity(product.verifiedBy),
    },
    {
      key: "no_draft_reference_media",
      label: "No attached media uses an imported draft-reference key",
      passed: product.media.every(
        (media) => !isDraftReferenceProductMediaKey(media.storageKey),
      ),
    },
    {
      key: "all_media_approved",
      label: "Every attached media record is an uploaded, rights-cleared public asset",
      passed: mediaGates.length > 0 && mediaGates.every((gate) => gate.ready),
    },
    {
      key: "one_primary_media",
      label: "Exactly one primary product-media record is selected",
      passed: primaryMedia.length === 1,
    },
    ...(primaryGate
      ? primaryGate.checks.map((check) => ({
          ...check,
          key: `primary_${check.key}`,
          label: `Primary media: ${check.label}`,
        }))
      : []),
  ];
  return { ready: checks.every((check) => check.passed), checks };
}

export function evaluateBrandPublicationGate(
  brand: BrandPublicationGateInput,
  gatePassingPublishedProductCount: number,
): CatalogGateResult {
  const checks: CatalogGateCheck[] = [
    {
      key: "brand_source",
      label: "Exact HTTPS brand source is confirmed",
      passed: isConfirmedHttpsUrl(brand.sourceUrl),
    },
    {
      key: "brand_verified_at",
      label: "Brand source verification date is recorded",
      passed: validDate(brand.verifiedAt),
    },
    {
      key: "brand_verified_by",
      label: "Verifying Owner identity is recorded as an exact email",
      passed: isOwnerIdentity(brand.verifiedBy),
    },
    {
      key: "published_products",
      label: `At least ${minimumPublishedProductsPerBrand} gate-passing products are published`,
      passed: gatePassingPublishedProductCount >= minimumPublishedProductsPerBrand,
    },
  ];
  return { ready: checks.every((check) => check.passed), checks };
}
