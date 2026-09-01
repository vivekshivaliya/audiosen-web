import { ProductStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  assertNoCatalogInventoryClaims,
  CatalogDraftPolicyError,
  normalizeCatalogFeatureRecord,
  parseCatalogSpecificationsJson,
  statusAfterCatalogFactsEdit,
} from "@/lib/admin/catalog-draft-policy";

describe("catalog draft policy", () => {
  it("stores every controlled feature as an explicit tri-state", () => {
    expect(
      normalizeCatalogFeatureRecord({ rechargeable: "yes", auracast: "no" }),
    ).toEqual({
      rechargeable: "yes",
      bluetoothStreaming: "unknown",
      auracast: "no",
      appControl: "unknown",
      crosSupport: "unknown",
      pediatricPath: "unknown",
      powerFormat: "unknown",
      customFit: "unknown",
    });
    expect(() => normalizeCatalogFeatureRecord({ rechargeable: "maybe" })).toThrow(
      CatalogDraftPolicyError,
    );
  });

  it("accepts only specification objects and rejects inventory fields at any depth", () => {
    expect(
      parseCatalogSpecificationsJson('{"battery":{"chemistry":"lithium-ion"},"ipRating":"IP68"}'),
    ).toEqual({ battery: { chemistry: "lithium-ion" }, ipRating: "IP68" });
    expect(parseCatalogSpecificationsJson("  ")).toBeNull();
    expect(() => parseCatalogSpecificationsJson("[]")).toThrowError(
      new CatalogDraftPolicyError("OBJECT_REQUIRED"),
    );
    expect(() =>
      parseCatalogSpecificationsJson('{"commercial":{"stockStatus":"in-stock"}}'),
    ).toThrowError(new CatalogDraftPolicyError("INVENTORY_CLAIM"));
    expect(() =>
      parseCatalogSpecificationsJson('{"notes":["Available now for same-day dispatch"]}'),
    ).toThrowError(new CatalogDraftPolicyError("INVENTORY_CLAIM"));
  });

  it("rejects stock and current-availability promises in editable facts", () => {
    expect(() => assertNoCatalogInventoryClaims(["Fitting follows an assessment.", null])).not.toThrow();
    expect(() => assertNoCatalogInventoryClaims(["Limited stock available now."])).toThrowError(
      new CatalogDraftPolicyError("INVENTORY_CLAIM"),
    );
  });

  it("returns every edited non-archived model to draft while preserving archives", () => {
    expect(statusAfterCatalogFactsEdit(ProductStatus.PUBLISHED)).toBe(ProductStatus.DRAFT);
    expect(statusAfterCatalogFactsEdit(ProductStatus.DRAFT)).toBe(ProductStatus.DRAFT);
    expect(statusAfterCatalogFactsEdit(ProductStatus.ARCHIVED)).toBe(ProductStatus.ARCHIVED);
  });
});
