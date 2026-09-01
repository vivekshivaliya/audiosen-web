export const catalogV1BrandSlugs = ["phonak", "signia", "widex", "resound", "oticon", "starkey"] as const;

export const catalogV1ModelPaths = [
  "phonak/audeo-infinio-ultra-sphere",
  "phonak/audeo-infinio-ultra-r",
  "phonak/virto-r-infinio",
  "phonak/cros-infinio",
  "phonak/naida-lumity",
  "phonak/sky-lumity",
  "signia/pure-charge-go-bct-ix",
  "signia/pure-charge-go-ix",
  "signia/silk-charge-go-ix",
  "signia/active-pro-ix",
  "signia/styletto-ix",
  "signia/motion-charge-go-ix",
  "widex/allure-ric-r-d",
  "widex/allure-bte-r-d",
  "widex/allure-ite-r-d",
  "widex/smartric",
  "widex/moment-sheer",
  "widex/beyond",
  "resound/vivia",
  "resound/savi",
  "resound/nexia",
  "resound/omnia",
  "resound/key",
  "resound/vivia-rie",
  "oticon/intent",
  "oticon/real",
  "oticon/own-si",
  "oticon/xceed",
  "oticon/play-px",
  "oticon/zircon",
  "starkey/genesis-ai",
  "starkey/evolv-ai",
  "starkey/picasso",
  "starkey/livio-edge-ai",
] as const;

const catalogBrandSlugs = new Set<string>(catalogV1BrandSlugs);
const catalogModelPaths = new Set<string>(catalogV1ModelPaths);

export function isV1CatalogModelPath(brandSlug: string, modelSlug: string): boolean {
  return catalogModelPaths.has(`${brandSlug}/${modelSlug}`);
}

export function isInvalidStagedCatalogPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "hearing-aids") return false;
  if (segments.length === 1) return false;
  if (segments.length === 2) return !catalogBrandSlugs.has(segments[1]);
  if (segments.length === 3) return !catalogModelPaths.has(`${segments[1]}/${segments[2]}`);
  return true;
}
