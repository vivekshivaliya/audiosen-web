import { afterEach, describe, expect, it } from "vitest";
import {
  isCatalogPublicationEnabled,
  isCatalogStagingPreviewEnabled,
  isCatalogSurfaceEnabled,
} from "@/lib/catalog/launch";

const originalPublication = process.env.CATALOG_PUBLICATION_ENABLED;
const originalPreview = process.env.CATALOG_STAGING_PREVIEW_ENABLED;

afterEach(() => {
  if (originalPublication === undefined) delete process.env.CATALOG_PUBLICATION_ENABLED;
  else process.env.CATALOG_PUBLICATION_ENABLED = originalPublication;
  if (originalPreview === undefined) delete process.env.CATALOG_STAGING_PREVIEW_ENABLED;
  else process.env.CATALOG_STAGING_PREVIEW_ENABLED = originalPreview;
});

describe("catalog launch switches", () => {
  it("defaults both independent switches to false", () => {
    delete process.env.CATALOG_PUBLICATION_ENABLED;
    delete process.env.CATALOG_STAGING_PREVIEW_ENABLED;
    expect(isCatalogPublicationEnabled()).toBe(false);
    expect(isCatalogStagingPreviewEnabled()).toBe(false);
    expect(isCatalogSurfaceEnabled()).toBe(false);
  });

  it("allows the Edge surface for either explicit switch only", () => {
    process.env.CATALOG_STAGING_PREVIEW_ENABLED = "true";
    expect(isCatalogSurfaceEnabled()).toBe(true);
    process.env.CATALOG_STAGING_PREVIEW_ENABLED = "false";
    process.env.CATALOG_PUBLICATION_ENABLED = "true";
    expect(isCatalogSurfaceEnabled()).toBe(true);
    process.env.CATALOG_PUBLICATION_ENABLED = "TRUE";
    expect(isCatalogSurfaceEnabled()).toBe(false);
  });
});
