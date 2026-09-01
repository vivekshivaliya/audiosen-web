const STAGED_CATALOG_SURFACES = [
  "/hearing-aids",
  "/compare-hearing-aids",
  "/find-my-hearing-aid",
  "/hearing-aid-trial",
] as const;

export function isCatalogStagingPreviewEnabled(): boolean {
  return process.env.CATALOG_STAGING_PREVIEW_ENABLED === "true";
}

export function isCatalogPublicationEnabled(): boolean {
  return process.env.CATALOG_PUBLICATION_ENABLED === "true";
}

export function isCatalogSurfaceEnabled(): boolean {
  return isCatalogPublicationEnabled() || isCatalogStagingPreviewEnabled();
}

export function isStagedCatalogSurface(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return STAGED_CATALOG_SURFACES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
