"use server";

import { AdminRole, MediaRightsStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import {
  catalogManagementNotice,
  confirmBrandSource,
  confirmProductSource,
  createCatalogBrandDraft,
  createCatalogProductDraft,
  recordProductMediaRights,
  revokeBrandSource,
  revokeProductSource,
  selectPrimaryProductMedia,
  setBrandPublication,
  setCatalogProductArchived,
  setProductPublication,
  updateCatalogBrandDraft,
  updateCatalogProductDraft,
} from "@/lib/admin/catalog-management";
import { catalogFeatureKeys, type TriState } from "@/lib/catalog/types";

const identifierSchema = z.string().uuid();
const publicationSchema = z.enum(["publish", "unpublish"]);
const archiveSchema = z.enum(["archive", "restore"]);
const triStateSchema = z.enum(["yes", "no", "unknown"]);

function finish(notice: string): never {
  revalidatePath("/admin/catalog");
  redirect(`/admin/catalog?notice=${encodeURIComponent(notice)}`);
}

function requireExplicitConfirmation(formData: FormData, expected: string): void {
  if (formData.get("confirmation") !== expected) {
    throw new Error("Explicit Owner confirmation is required.");
  }
}

export async function createCatalogBrandDraftAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await createCatalogBrandDraft({
      actor: admin,
      slug: z.string().parse(formData.get("slug")),
      name: z.string().parse(formData.get("name")),
      description: z.string().parse(formData.get("description")),
      sortOrder: z.string().parse(formData.get("sortOrder")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("brand_draft_created");
}

export async function updateCatalogBrandDraftAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    requireExplicitConfirmation(formData, "brand_facts_update_confirmed");
    await updateCatalogBrandDraft({
      actor: admin,
      brandId: identifierSchema.parse(formData.get("brandId")),
      name: z.string().parse(formData.get("name")),
      description: z.string().parse(formData.get("description")),
      sortOrder: z.string().parse(formData.get("sortOrder")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("brand_details_updated");
}

export async function createCatalogProductDraftAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await createCatalogProductDraft({
      actor: admin,
      brandId: identifierSchema.parse(formData.get("brandId")),
      slug: z.string().parse(formData.get("slug")),
      modelName: z.string().parse(formData.get("modelName")),
      style: z.string().parse(formData.get("style")),
      sortOrder: z.string().parse(formData.get("sortOrder")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("product_draft_created");
}

export async function updateCatalogProductDraftAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    requireExplicitConfirmation(formData, "product_facts_update_confirmed");
    const features = Object.fromEntries(
      catalogFeatureKeys.map((key) => [
        key,
        triStateSchema.parse(formData.get(`feature_${key}`)),
      ]),
    );
    await updateCatalogProductDraft({
      actor: admin,
      productId: identifierSchema.parse(formData.get("productId")),
      modelName: z.string().parse(formData.get("modelName")),
      style: z.string().parse(formData.get("style")),
      summary: z.string().parse(formData.get("summary")),
      suitableUse: z.string().parse(formData.get("suitableUse")),
      rechargeable: triStateSchema.parse(formData.get("rechargeable")) as TriState,
      bluetooth: triStateSchema.parse(formData.get("bluetooth")) as TriState,
      streaming: triStateSchema.parse(formData.get("streaming")) as TriState,
      mobileApp: z.string().parse(formData.get("mobileApp")),
      hearingLossSuitability: z.string().parse(formData.get("hearingLossSuitability")),
      noiseManagement: z.string().parse(formData.get("noiseManagement")),
      warranty: z.string().parse(formData.get("warranty")),
      fittingInformation: z.string().parse(formData.get("fittingInformation")),
      afterCare: z.string().parse(formData.get("afterCare")),
      repairSupport: z.string().parse(formData.get("repairSupport")),
      consultationRequired: formData.get("consultationRequired") === "true",
      priceNote: z.string().parse(formData.get("priceNote")),
      isFeatured: formData.get("isFeatured") === "true",
      sortOrder: z.string().parse(formData.get("sortOrder")),
      features,
      specificationsJson: z.string().parse(formData.get("specificationsJson")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("product_details_updated");
}

export async function setCatalogProductArchivedAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    const intent = archiveSchema.parse(formData.get("intent"));
    if (intent === "archive") requireExplicitConfirmation(formData, "archive_confirmed");
    await setCatalogProductArchived({
      actor: admin,
      productId: identifierSchema.parse(formData.get("productId")),
      archived: intent === "archive",
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("product_lifecycle_updated");
}

export async function confirmBrandSourceAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    requireExplicitConfirmation(formData, "source_confirmed");
    await confirmBrandSource({
      actor: admin,
      brandId: identifierSchema.parse(formData.get("brandId")),
      sourceUrl: z.string().parse(formData.get("sourceUrl")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("brand_source_confirmed");
}

export async function revokeBrandSourceAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await revokeBrandSource({
      actor: admin,
      brandId: identifierSchema.parse(formData.get("brandId")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("brand_source_revoked");
}

export async function confirmProductSourceAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    requireExplicitConfirmation(formData, "source_confirmed");
    await confirmProductSource({
      actor: admin,
      productId: identifierSchema.parse(formData.get("productId")),
      sourceUrl: z.string().parse(formData.get("sourceUrl")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("product_source_confirmed");
}

export async function revokeProductSourceAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await revokeProductSource({
      actor: admin,
      productId: identifierSchema.parse(formData.get("productId")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("product_source_revoked");
}

export async function recordProductMediaRightsAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    requireExplicitConfirmation(formData, "rights_reviewed");
    await recordProductMediaRights({
      actor: admin,
      mediaId: identifierSchema.parse(formData.get("mediaId")),
      rightsStatus: z.nativeEnum(MediaRightsStatus).parse(formData.get("rightsStatus")),
      sourceUrl: z.string().parse(formData.get("sourceUrl")),
      rightsEvidenceUrl: z.string().parse(formData.get("rightsEvidenceUrl")),
      rightsNotes: z.string().parse(formData.get("rightsNotes")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("media_rights_recorded");
}

export async function selectPrimaryProductMediaAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    await selectPrimaryProductMedia({
      actor: admin,
      mediaId: identifierSchema.parse(formData.get("mediaId")),
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("primary_media_selected");
}

export async function setProductPublicationAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    const intent = publicationSchema.parse(formData.get("intent"));
    if (intent === "publish") requireExplicitConfirmation(formData, "publication_confirmed");
    await setProductPublication({
      actor: admin,
      productId: identifierSchema.parse(formData.get("productId")),
      publish: intent === "publish",
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("product_publication_updated");
}

export async function setBrandPublicationAction(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER]);
  try {
    const intent = publicationSchema.parse(formData.get("intent"));
    if (intent === "publish") requireExplicitConfirmation(formData, "publication_confirmed");
    await setBrandPublication({
      actor: admin,
      brandId: identifierSchema.parse(formData.get("brandId")),
      publish: intent === "publish",
    });
  } catch (error) {
    finish(catalogManagementNotice(error));
  }
  finish("brand_publication_updated");
}
