import { MediaRightsStatus, ProductStatus } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  featuredCatalogModelKeys,
  getStagedCatalogBrands,
  getStagedCatalogModels,
} from "@/lib/catalog/repository";
import { catalogV1BrandSlugs, catalogV1ModelPaths } from "@/lib/catalog/route-manifest";
import { requestFingerprint } from "@/lib/enquiries/security";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1]?.trim() : undefined;
}

function contentType(path: string): string {
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

async function main() {
  const brands = getStagedCatalogBrands();
  const models = getStagedCatalogModels();
  const sourceHash = requestFingerprint({ brands, models });
  const commit = process.argv.includes("--commit");
  const approverEmail = argument("--approved-by")?.toLowerCase();

  console.info("Staged catalogue import plan", {
    mode: commit ? "commit" : "dry-run",
    brandCount: brands.length,
    modelCount: models.length,
    sourceHash,
    publicationStatus: ProductStatus.DRAFT,
    mediaRightsStatus: MediaRightsStatus.UNVERIFIED,
    featuredModelKeys: featuredCatalogModelKeys,
  });
  if (brands.length !== catalogV1BrandSlugs.length || models.length !== catalogV1ModelPaths.length) {
    throw new Error("The staged source no longer matches the fixed public catalogue manifest.");
  }
  if (!commit) return;
  if (!approverEmail) {
    throw new Error("Commit requires --approved-by with the exact active Owner email.");
  }

  const prisma = getPrisma();
  const owner = await prisma.adminUser.findFirst({
    where: { email: approverEmail, active: true, role: "OWNER" },
    select: { id: true, email: true },
  });
  if (!owner) throw new Error("The approving email is not an active Owner.");

  for (const brand of brands) {
    const storedBrand = await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: {
        slug: brand.slug,
        name: brand.name,
        description: brand.summary,
        isPublished: false,
      },
      update: {
        name: brand.name,
        description: brand.summary,
      },
    });

    for (const model of models.filter((entry) => entry.brandSlug === brand.slug)) {
      const checkedAt = model.source.checkedAt ? new Date(model.source.checkedAt) : null;
      const storedModel = await prisma.hearingAid.upsert({
        where: { brandId_slug: { brandId: storedBrand.id, slug: model.slug } },
        create: {
          brandId: storedBrand.id,
          slug: model.slug,
          modelName: model.name,
          style: model.style,
          summary: model.summary,
          rechargeable:
            model.features.rechargeable === "unknown"
              ? null
              : model.features.rechargeable === "yes",
          bluetooth:
            model.features.bluetoothStreaming === "unknown"
              ? null
              : model.features.bluetoothStreaming === "yes",
          streaming:
            model.features.bluetoothStreaming === "unknown"
              ? null
              : model.features.bluetoothStreaming === "yes",
          features: model.features,
          status: ProductStatus.DRAFT,
          isFeatured: featuredCatalogModelKeys.includes(model.key as (typeof featuredCatalogModelKeys)[number]),
          sourceUrl: model.source.url,
          verifiedAt: checkedAt,
          verifiedBy: checkedAt ? "manufacturer-source-audit" : null,
        },
        update: {
          modelName: model.name,
          style: model.style,
          summary: model.summary,
          features: model.features,
          isFeatured: featuredCatalogModelKeys.includes(model.key as (typeof featuredCatalogModelKeys)[number]),
          sourceUrl: model.source.url,
          verifiedAt: checkedAt,
          verifiedBy: checkedAt ? "manufacturer-source-audit" : null,
        },
      });

      if (model.media.assetPath) {
        const storageKey = `draft-reference/${model.media.assetPath.replace(/^\/+/, "")}`;
        await prisma.productMedia.upsert({
          where: { storageKey },
          create: {
            hearingAidId: storedModel.id,
            storageKey,
            altText: model.media.alt,
            contentType: contentType(model.media.assetPath),
            isPrimary: false,
            rightsStatus: MediaRightsStatus.UNVERIFIED,
            rightsNotes:
              "Legacy local reference only. Do not publish until an owner records source, rights evidence, and approval.",
          },
          update: {
            hearingAidId: storedModel.id,
            altText: model.media.alt,
            isPrimary: false,
            rightsStatus: MediaRightsStatus.UNVERIFIED,
            rightsApprovedAt: null,
            rightsApprovedBy: null,
          },
        });
      }
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: owner.id,
      action: "catalog.staged_drafts_imported",
      entityType: "CatalogImport",
      entityId: sourceHash,
      metadata: {
        sourceHash,
        brandCount: brands.length,
        modelCount: models.length,
        publicationStatus: ProductStatus.DRAFT,
        mediaRightsStatus: MediaRightsStatus.UNVERIFIED,
      },
    },
  });
  console.info("Staged catalogue drafts imported", {
    sourceHash,
    brandCount: brands.length,
    modelCount: models.length,
  });
}

main()
  .catch((error) => {
    console.error("Staged catalogue import stopped", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    if (isDatabaseConfigured()) await getPrisma().$disconnect().catch(() => undefined);
  });
