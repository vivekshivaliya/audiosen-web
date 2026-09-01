export const catalogBrandSlugs = ["phonak", "signia", "widex", "resound", "oticon", "starkey"] as const;

export type CatalogBrandSlug = (typeof catalogBrandSlugs)[number];

export const catalogDeviceStyles = [
  "ric",
  "bte",
  "ite",
  "cic",
  "earbud",
  "cros",
  "various",
] as const;

export type CatalogDeviceStyle = (typeof catalogDeviceStyles)[number];

export type TriState = "yes" | "no" | "unknown";

export const catalogFeatureKeys = [
  "rechargeable",
  "bluetoothStreaming",
  "auracast",
  "appControl",
  "crosSupport",
  "pediatricPath",
  "powerFormat",
  "customFit",
] as const;

export type CatalogFeatureKey = (typeof catalogFeatureKeys)[number];

export type CatalogFeatureRecord = Record<CatalogFeatureKey, TriState>;

export type CatalogVerificationStatus =
  | "legacy-editorial-record"
  | "manufacturer-source-checked"
  | "owner-source-confirmed";

export type CatalogPublicationStatus = "guidance-only" | "owner-approved" | "withheld";

export type CatalogMediaRightsStatus = "cleared" | "pending" | "restricted";

export interface CatalogSource {
  kind: "legacy-audiosen-catalogue" | "manufacturer";
  label: string;
  url?: string;
  checkedAt?: string;
}

export interface CatalogMedia {
  assetPath: string;
  alt: string;
  rightsStatus: CatalogMediaRightsStatus;
  publicUseApproved: boolean;
  rightsNote: string;
}

export interface CatalogPublication {
  status: CatalogPublicationStatus;
  note: string;
}

export interface CatalogVerification {
  status: CatalogVerificationStatus;
  note: string;
  checkedAt?: string;
}

export interface CatalogBrand {
  slug: CatalogBrandSlug;
  name: string;
  summary: string;
  logoPath: string;
  publication: CatalogPublication;
  source: CatalogSource;
  mediaRights: Omit<CatalogMedia, "assetPath" | "alt">;
}

export interface CatalogModel {
  /** Stable URL/query identifier. Never derive this from display copy at runtime. */
  key: `${CatalogBrandSlug}~${string}`;
  slug: string;
  brandSlug: CatalogBrandSlug;
  name: string;
  style: CatalogDeviceStyle;
  summary: string;
  /** Owner-controlled display priority; does not imply availability or approval. */
  isFeatured: boolean;
  features: CatalogFeatureRecord;
  publication: CatalogPublication;
  verification: CatalogVerification;
  source: CatalogSource;
  media: CatalogMedia;
}

export interface CatalogFilterState {
  brand?: CatalogBrandSlug;
  style?: CatalogDeviceStyle;
  charging?: "rechargeable" | "unknown";
  connectivity?: "bluetooth" | "unknown";
  query?: string;
}

export type CatalogSnapshot = Readonly<{
  mode: "preview" | "published";
  brands: readonly CatalogBrand[];
  models: readonly CatalogModel[];
}>;
