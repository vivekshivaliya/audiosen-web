import { MediaRightsStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  evaluateBrandPublicationGate,
  evaluateProductMediaGate,
  evaluateProductPublicationGate,
  isPublishableProductMediaKey,
} from "@/lib/admin/catalog-gates";

const approvedMedia = {
  id: "media-1",
  storageKey: "products/phonak/audeo-primary.webp",
  altText: "Phonak Audéo hearing aid",
  contentType: "image/webp",
  width: 1200,
  height: 1200,
  isPrimary: true,
  sourceUrl: "https://www.phonak.com/example-source",
  rightsStatus: MediaRightsStatus.MANUFACTURER_AUTHORIZED,
  rightsEvidenceUrl: "https://evidence.audiosen.com/rights/record-1",
  rightsCheckedAt: new Date("2026-08-20T00:00:00.000Z"),
  rightsApprovedAt: new Date("2026-08-21T00:00:00.000Z"),
  rightsApprovedBy: "owner@audiosen.com",
};

const verifiedProduct = {
  sourceUrl: "https://www.phonak.com/example-model",
  verifiedAt: new Date("2026-08-21T00:00:00.000Z"),
  verifiedBy: "owner@audiosen.com",
  media: [approvedMedia],
};

describe("catalog publication gates", () => {
  it("accepts a fully source-verified product with one rights-cleared primary image", () => {
    expect(evaluateProductPublicationGate(verifiedProduct).ready).toBe(true);
  });

  it("always rejects imported draft-reference media", () => {
    expect(
      isPublishableProductMediaKey(
        "draft-reference/images/products/model.webp",
        "image/webp",
        1200,
        1200,
      ),
    ).toBe(false);
    expect(
      evaluateProductMediaGate({
        ...approvedMedia,
        storageKey: "draft-reference/images/products/model.webp",
      }).ready,
    ).toBe(false);
    expect(
      evaluateProductPublicationGate({
        ...verifiedProduct,
        media: [
          approvedMedia,
          {
            ...approvedMedia,
            id: "media-2",
            storageKey: "draft-reference/images/products/secondary.webp",
            isPrimary: false,
            rightsStatus: MediaRightsStatus.UNVERIFIED,
          },
        ],
      }).ready,
    ).toBe(false);
  });

  it("rejects incomplete source verification and non-owner verifier identity", () => {
    const result = evaluateProductPublicationGate({
      ...verifiedProduct,
      verifiedAt: null,
      verifiedBy: "manufacturer-source-audit",
    });
    expect(result.ready).toBe(false);
    expect(result.checks.filter((check) => !check.passed).map((check) => check.key)).toEqual([
      "product_verified_at",
      "product_verified_by",
    ]);
  });

  it("rejects missing rights evidence and ambiguous primary selection", () => {
    expect(
      evaluateProductPublicationGate({
        ...verifiedProduct,
        media: [{ ...approvedMedia, rightsEvidenceUrl: null }],
      }).ready,
    ).toBe(false);
    expect(
      evaluateProductPublicationGate({
        ...verifiedProduct,
        media: [approvedMedia, { ...approvedMedia, id: "media-2" }],
      }).ready,
    ).toBe(false);
  });

  it("rejects a product while any attached media still has pending rights", () => {
    const result = evaluateProductPublicationGate({
      ...verifiedProduct,
      media: [
        approvedMedia,
        {
          ...approvedMedia,
          id: "media-2",
          storageKey: "products/phonak/audeo-secondary.webp",
          isPrimary: false,
          rightsStatus: MediaRightsStatus.UNVERIFIED,
          rightsApprovedAt: null,
          rightsApprovedBy: null,
        },
      ],
    });
    expect(result.ready).toBe(false);
    expect(result.checks.find((check) => check.key === "all_media_approved")?.passed).toBe(false);
  });

  it("requires four gate-passing published products before brand publication", () => {
    const verifiedBrand = {
      sourceUrl: "https://www.phonak.com/",
      verifiedAt: new Date("2026-08-21T00:00:00.000Z"),
      verifiedBy: "owner@audiosen.com",
    };
    expect(evaluateBrandPublicationGate(verifiedBrand, 3).ready).toBe(false);
    expect(evaluateBrandPublicationGate(verifiedBrand, 4).ready).toBe(true);
  });
});
