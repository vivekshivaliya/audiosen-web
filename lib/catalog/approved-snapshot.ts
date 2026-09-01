import "server-only";

import { ProductStatus } from "@prisma/client";
import { cache } from "react";
import {
  buildApprovedCatalogSnapshot,
  type ApprovedCatalogDatabaseBrand,
  type ApprovedCatalogSnapshot,
} from "@/lib/catalog/approved-snapshot-core";
import { isCatalogPublicationEnabled } from "@/lib/catalog/launch";
import { parseCatalogPublicMediaBaseUrl } from "@/lib/catalog/public-media";
import { catalogV1BrandSlugs } from "@/lib/catalog/route-manifest";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

const loadApprovedCatalogSnapshot = cache(async (): Promise<ApprovedCatalogSnapshot | null> => {
  if (
    !isCatalogPublicationEnabled() ||
    !isDatabaseConfigured() ||
    !parseCatalogPublicMediaBaseUrl(process.env.CATALOG_PUBLIC_MEDIA_BASE_URL)
  ) {
    return null;
  }

  try {
    const records = await getPrisma().brand.findMany({
      where: {
        slug: { in: [...catalogV1BrandSlugs] },
        isPublished: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        isPublished: true,
        sortOrder: true,
        sourceUrl: true,
        verifiedAt: true,
        verifiedBy: true,
        hearingAids: {
          where: { status: ProductStatus.PUBLISHED },
          select: {
            id: true,
            slug: true,
            modelName: true,
            style: true,
            summary: true,
            rechargeable: true,
            bluetooth: true,
            streaming: true,
            features: true,
            status: true,
            isFeatured: true,
            sortOrder: true,
            sourceUrl: true,
            verifiedAt: true,
            verifiedBy: true,
            media: {
              select: {
                id: true,
                hearingAidId: true,
                storageKey: true,
                altText: true,
                contentType: true,
                width: true,
                height: true,
                isPrimary: true,
                sourceUrl: true,
                rightsStatus: true,
                rightsEvidenceUrl: true,
                rightsCheckedAt: true,
                rightsApprovedAt: true,
                rightsApprovedBy: true,
              },
            },
          },
        },
      },
    });
    return buildApprovedCatalogSnapshot(records as ApprovedCatalogDatabaseBrand[]);
  } catch {
    return null;
  }
});

export async function getApprovedCatalogSnapshot(): Promise<ApprovedCatalogSnapshot | null> {
  return loadApprovedCatalogSnapshot();
}

export async function getApprovedCatalogMediaAsset(mediaId: string) {
  const snapshot = await getApprovedCatalogSnapshot();
  return snapshot?.mediaAssets.find((asset) => asset.id === mediaId) ?? null;
}
