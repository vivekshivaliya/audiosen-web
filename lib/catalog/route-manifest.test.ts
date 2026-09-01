import { describe, expect, it } from "vitest";
import {
  catalogV1BrandSlugs,
  catalogV1ModelPaths,
  isInvalidStagedCatalogPath,
  isV1CatalogModelPath,
} from "@/lib/catalog/route-manifest";

describe("fixed V1 catalog route manifest", () => {
  it("keeps every catalogued brand with at least four model paths", () => {
    expect(catalogV1BrandSlugs).toHaveLength(6);
    expect(catalogV1ModelPaths).toHaveLength(34);
    for (const brand of catalogV1BrandSlugs) {
      expect(catalogV1ModelPaths.filter((path) => path.startsWith(`${brand}/`)).length).toBeGreaterThanOrEqual(4);
    }
    for (const path of catalogV1ModelPaths) {
      const [brand, model] = path.split("/");
      expect(isV1CatalogModelPath(brand, model)).toBe(true);
      expect(isInvalidStagedCatalogPath(`/hearing-aids/${path}`)).toBe(false);
    }
  });

  it("continues rejecting unknown brands, models, and deeper paths", () => {
    expect(isInvalidStagedCatalogPath("/hearing-aids/unknown")).toBe(true);
    expect(isInvalidStagedCatalogPath("/hearing-aids/phonak/unknown")).toBe(true);
    expect(isInvalidStagedCatalogPath("/hearing-aids/phonak/audeo-infinio-ultra-r/extra")).toBe(true);
  });
});
