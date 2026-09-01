import { MediaRightsStatus, ProductStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildApprovedCatalogSnapshot,
  mapApprovedCatalogFeatures,
  type ApprovedCatalogDatabaseBrand,
} from "@/lib/catalog/approved-snapshot-core";
import {
  catalogV1BrandSlugs,
  catalogV1ModelPaths,
} from "@/lib/catalog/route-manifest";

const approvedAt = new Date("2026-08-21T00:00:00.000Z");
const checkedAt = new Date("2026-08-20T00:00:00.000Z");

function modelSlugs(brandSlug: string): string[] {
  return catalogV1ModelPaths
    .filter((path) => path.startsWith(`${brandSlug}/`))
    .map((path) => path.split("/")[1]);
}

function approvedDatabase(): ApprovedCatalogDatabaseBrand[] {
  return catalogV1BrandSlugs.map((brandSlug, brandIndex) => ({
    id: `10000000-0000-4000-8000-00000000000${brandIndex}`,
    slug: brandSlug,
    name: brandSlug === "resound" ? "ReSound" : `${brandSlug[0].toUpperCase()}${brandSlug.slice(1)}`,
    description: `${brandSlug} approved records`,
    isPublished: true,
    sortOrder: brandIndex,
    sourceUrl: `https://manufacturer.example/${brandSlug}`,
    verifiedAt: approvedAt,
    verifiedBy: "owner@audiosen.com",
    hearingAids: modelSlugs(brandSlug).slice(0, 4).map((slug, modelIndex) => {
      const productId = `${brandIndex + 1}0000000-0000-4000-8000-0000000000${modelIndex}`;
      const mediaId = `${brandIndex + 5}0000000-0000-4000-8000-0000000000${modelIndex}`;
      return {
        id: productId,
        slug,
        modelName: slug,
        style: "ric",
        summary: `${slug} summary`,
        rechargeable: true,
        bluetooth: true,
        streaming: true,
        features: { rechargeable: "yes", bluetoothStreaming: "yes", auracast: "invalid" },
        status: ProductStatus.PUBLISHED,
        isFeatured: brandSlug === "phonak" && modelIndex === 0,
        sortOrder: modelIndex,
        sourceUrl: `https://manufacturer.example/${brandSlug}/${slug}`,
        verifiedAt: approvedAt,
        verifiedBy: "owner@audiosen.com",
        media: [
          {
            id: mediaId,
            hearingAidId: productId,
            storageKey: `catalog/${brandSlug}/${slug}.webp`,
            altText: `${brandSlug} ${slug} hearing aid`,
            contentType: "image/webp",
            width: 1200,
            height: 900,
            isPrimary: true,
            sourceUrl: `https://manufacturer.example/assets/${slug}`,
            rightsStatus: MediaRightsStatus.MANUFACTURER_AUTHORIZED,
            rightsEvidenceUrl: `https://evidence.example/${brandSlug}/${slug}`,
            rightsCheckedAt: checkedAt,
            rightsApprovedAt: approvedAt,
            rightsApprovedBy: "owner@audiosen.com",
          },
        ],
      };
    }),
  }));
}

describe("approved database catalog snapshot", () => {
  it("requires every catalogued brand and four gate-passing V1 models per brand", () => {
    const snapshot = buildApprovedCatalogSnapshot(approvedDatabase());
    expect(snapshot?.brands).toHaveLength(6);
    expect(snapshot?.models).toHaveLength(24);
    expect(snapshot?.models.every((model) => model.publication.status === "owner-approved")).toBe(true);
    expect(snapshot?.models.every((model) => /^\/catalog-media\/[0-9a-f-]+$/.test(model.media.assetPath))).toBe(true);
    expect(snapshot?.mediaAssets.every((asset) => !snapshot.models.some((model) => model.media.assetPath.includes(asset.storageKey)))).toBe(true);
  });

  it("fails closed when a primary brand or its fourth approved model is missing", () => {
    expect(buildApprovedCatalogSnapshot(approvedDatabase().slice(0, 3))).toBeNull();
    const records = approvedDatabase();
    records[0] = { ...records[0], hearingAids: records[0].hearingAids.slice(0, 3) };
    expect(buildApprovedCatalogSnapshot(records)).toBeNull();
  });

  it("fails closed for unpublished, pending-rights, or draft-reference records", () => {
    const unpublished = approvedDatabase();
    unpublished[0] = { ...unpublished[0], isPublished: false };
    expect(buildApprovedCatalogSnapshot(unpublished)).toBeNull();

    const pending = approvedDatabase();
    const first = pending[0].hearingAids[0];
    pending[0] = {
      ...pending[0],
      hearingAids: [
        {
          ...first,
          media: [{ ...first.media[0], rightsStatus: MediaRightsStatus.UNVERIFIED }],
        },
        ...pending[0].hearingAids.slice(1),
      ],
    };
    expect(buildApprovedCatalogSnapshot(pending)).toBeNull();

    const draftReference = approvedDatabase();
    const draftFirst = draftReference[0].hearingAids[0];
    draftReference[0] = {
      ...draftReference[0],
      hearingAids: [
        {
          ...draftFirst,
          media: [{ ...draftFirst.media[0], storageKey: "draft-reference/model.webp" }],
        },
        ...draftReference[0].hearingAids.slice(1),
      ],
    };
    expect(buildApprovedCatalogSnapshot(draftReference)).toBeNull();
  });

  it("does not count an otherwise approved model outside the fixed V1 manifest", () => {
    const records = approvedDatabase();
    records[0] = {
      ...records[0],
      hearingAids: [
        ...records[0].hearingAids.slice(0, 3),
        { ...records[0].hearingAids[3], slug: "unmanifested-model" },
      ],
    };
    expect(buildApprovedCatalogSnapshot(records)).toBeNull();
  });

  it("maps only exact tri-state values and resolves conflicting columns to unknown", () => {
    expect(
      mapApprovedCatalogFeatures({
        rechargeable: true,
        bluetooth: true,
        streaming: false,
        features: {
          rechargeable: "no",
          bluetoothStreaming: "yes",
          auracast: true,
          appControl: "yes",
          crosSupport: "no",
        },
      }),
    ).toMatchObject({
      rechargeable: "unknown",
      bluetoothStreaming: "unknown",
      auracast: "unknown",
      appControl: "yes",
      crosSupport: "no",
      pediatricPath: "unknown",
    });
  });
});
