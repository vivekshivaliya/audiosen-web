import {
  AdminRole,
  MediaRightsStatus,
  Prisma,
  ProductStatus,
} from "@prisma/client";
import { z } from "zod";
import {
  evaluateBrandPublicationGate,
  evaluateProductMediaGate,
  evaluateProductPublicationGate,
  isApprovedMediaRightsStatus,
  isConfirmedHttpsUrl,
  isDraftReferenceProductMediaKey,
  isPublishableProductMediaKey,
} from "@/lib/admin/catalog-gates";
import {
  assertNoCatalogInventoryClaims,
  assertNoCatalogStructuredInventoryClaims,
  CatalogDraftPolicyError,
  normalizeCatalogFeatureRecord,
  parseCatalogSpecificationsJson,
  statusAfterCatalogFactsEdit,
} from "@/lib/admin/catalog-draft-policy";
import { catalogDeviceStyles, catalogFeatureKeys, type TriState } from "@/lib/catalog/types";
import { getPrisma } from "@/lib/db";

export type CatalogAdminActor = Readonly<{
  id: string;
  email: string;
  role: AdminRole;
}>;

export type CatalogManagementCode =
  | "OWNER_REQUIRED"
  | "BRAND_NOT_FOUND"
  | "PRODUCT_NOT_FOUND"
  | "MEDIA_NOT_FOUND"
  | "INVALID_INPUT"
  | "NO_CHANGE"
  | "INVALID_TRANSITION"
  | "GATE_INCOMPLETE"
  | "DRAFT_REFERENCE_MEDIA"
  | "INVENTORY_CLAIM"
  | "DUPLICATE_SLUG";

export class CatalogManagementError extends Error {
  constructor(
    public readonly code: CatalogManagementCode,
    public readonly failedChecks: readonly string[] = [],
  ) {
    super(code);
    this.name = "CatalogManagementError";
  }
}

const identifierSchema = z.string().uuid();
const stableSlugSchema = (maximum: number) =>
  z.string().trim().min(1).max(maximum).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const brandSlugSchema = stableSlugSchema(100);
const productSlugSchema = stableSlugSchema(140);
const brandNameSchema = z.string().trim().min(2).max(120);
const modelNameSchema = z.string().trim().min(2).max(180);
const sortOrderSchema = z.coerce.number().int().min(-10_000).max(10_000);
const styleSchema = z.enum(catalogDeviceStyles);
const triStateSchema = z.enum(["yes", "no", "unknown"]);
const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).transform((value) => value || null);
const sourceUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(isConfirmedHttpsUrl, "An exact HTTPS source URL is required.");
const optionalMediaSourceUrlSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value || null)
  .refine((value) => value === null || isConfirmedHttpsUrl(value), "Use an exact HTTPS asset source URL.");
const optionalEvidenceUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .transform((value) => value || null)
  .refine((value) => value === null || isConfirmedHttpsUrl(value), "Use an exact HTTPS evidence URL.");
const optionalRightsNotesSchema = z
  .string()
  .trim()
  .max(1000)
  .transform((value) => value || null);
const uploadedMediaStorageKeySchema = z
  .string()
  .trim()
  .max(500)
  .regex(
    /^catalog\/\d{4}\/(?:0[1-9]|1[0-2])\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:webp|avif)$/i,
  );
const uploadedMediaAltTextSchema = z.string().trim().min(1).max(240);
const uploadedMediaContentTypeSchema = z.enum(["image/webp", "image/avif"]);
const uploadedMediaDimensionSchema = z.number().int().positive().max(2400);
const uploadedMediaDigestSchema = z.string().regex(/^[0-9a-f]{64}$/);

const mediaGateSelect = {
  id: true,
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
} satisfies Prisma.ProductMediaSelect;

const productGateSelect = {
  id: true,
  brandId: true,
  status: true,
  sourceUrl: true,
  verifiedAt: true,
  verifiedBy: true,
  summary: true,
  suitableUse: true,
  mobileApp: true,
  hearingLossSuitability: true,
  noiseManagement: true,
  warranty: true,
  fittingInformation: true,
  afterCare: true,
  repairSupport: true,
  priceNote: true,
  features: true,
  specifications: true,
  media: { select: mediaGateSelect },
} satisfies Prisma.HearingAidSelect;

const transactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;

function triStateBoolean(value: TriState): boolean | null {
  return value === "yes" ? true : value === "no" ? false : null;
}

function parseFeatureRecord(input: Record<string, string>): Prisma.InputJsonObject {
  return normalizeCatalogFeatureRecord(input) as Prisma.InputJsonObject;
}

function productPassesInventoryClaimPolicy(
  product: Prisma.HearingAidGetPayload<{ select: typeof productGateSelect }>,
): boolean {
  try {
    assertNoCatalogInventoryClaims([
      product.summary,
      product.suitableUse,
      product.mobileApp,
      product.hearingLossSuitability,
      product.noiseManagement,
      product.warranty,
      product.fittingInformation,
      product.afterCare,
      product.repairSupport,
      product.priceNote,
    ]);
    assertNoCatalogStructuredInventoryClaims(product.features);
    assertNoCatalogStructuredInventoryClaims(product.specifications);
    return true;
  } catch (error) {
    if (error instanceof CatalogDraftPolicyError && error.code === "INVENTORY_CLAIM") return false;
    throw error;
  }
}

function brandPassesInventoryClaimPolicy(description: string | null): boolean {
  try {
    assertNoCatalogInventoryClaims([description]);
    return true;
  } catch (error) {
    if (error instanceof CatalogDraftPolicyError && error.code === "INVENTORY_CLAIM") return false;
    throw error;
  }
}

function assertOwnerRole(role: AdminRole): void {
  if (role !== AdminRole.OWNER) throw new CatalogManagementError("OWNER_REQUIRED");
}

async function requireCurrentOwner(
  transaction: Prisma.TransactionClient,
  actor: CatalogAdminActor,
) {
  const current = await transaction.adminUser.findUnique({
    where: { id: actor.id },
    select: { id: true, email: true, role: true, active: true },
  });
  if (
    !current?.active ||
    current.role !== AdminRole.OWNER ||
    current.email !== actor.email.trim().toLowerCase()
  ) {
    throw new CatalogManagementError("OWNER_REQUIRED");
  }
  return current;
}

async function audit(
  transaction: Prisma.TransactionClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Prisma.InputJsonObject,
): Promise<void> {
  await transaction.auditLog.create({
    data: { actorId, action, entityType, entityId, metadata },
  });
}

async function getGatePassingPublishedProductCount(
  transaction: Prisma.TransactionClient,
  brandId: string,
): Promise<number> {
  const products = await transaction.hearingAid.findMany({
    where: { brandId, status: ProductStatus.PUBLISHED },
    select: productGateSelect,
  });
  return products.filter(
    (product) =>
      evaluateProductPublicationGate(product).ready && productPassesInventoryClaimPolicy(product),
  ).length;
}

async function maintainBrandPublicationInvariant(
  transaction: Prisma.TransactionClient,
  brandId: string,
  actorId: string,
  trigger: string,
): Promise<void> {
  const brand = await transaction.brand.findUnique({
    where: { id: brandId },
    select: {
      id: true,
      description: true,
      isPublished: true,
      sourceUrl: true,
      verifiedAt: true,
      verifiedBy: true,
    },
  });
  if (!brand?.isPublished) return;

  const count = await getGatePassingPublishedProductCount(transaction, brand.id);
  const gate = evaluateBrandPublicationGate(brand, count);
  const inventoryClaimPolicyPassed = brandPassesInventoryClaimPolicy(brand.description);
  if (gate.ready && inventoryClaimPolicyPassed) return;

  await transaction.brand.update({
    where: { id: brand.id },
    data: { isPublished: false },
  });
  await audit(transaction, actorId, "catalog.brand_auto_unpublished", "Brand", brand.id, {
    trigger,
    gatePassingPublishedProductCount: count,
    failedChecks: [
      ...gate.checks.filter((check) => !check.passed).map((check) => check.key),
      ...(inventoryClaimPolicyPassed ? [] : ["inventory_claim_policy"]),
    ],
  });
}

async function maintainProductPublicationInvariant(
  transaction: Prisma.TransactionClient,
  productId: string,
  actorId: string,
  trigger: string,
): Promise<void> {
  const product = await transaction.hearingAid.findUnique({
    where: { id: productId },
    select: productGateSelect,
  });
  if (!product) throw new CatalogManagementError("PRODUCT_NOT_FOUND");

  const gate = evaluateProductPublicationGate(product);
  const inventoryClaimPolicyPassed = productPassesInventoryClaimPolicy(product);
  if (product.status === ProductStatus.PUBLISHED && (!gate.ready || !inventoryClaimPolicyPassed)) {
    await transaction.hearingAid.update({
      where: { id: product.id },
      data: { status: ProductStatus.DRAFT },
    });
    await audit(transaction, actorId, "catalog.product_auto_drafted", "HearingAid", product.id, {
      trigger,
      failedChecks: [
        ...gate.checks.filter((check) => !check.passed).map((check) => check.key),
        ...(inventoryClaimPolicyPassed ? [] : ["inventory_claim_policy"]),
      ],
    });
  }
  await maintainBrandPublicationInvariant(transaction, product.brandId, actorId, trigger);
}

export async function createUnverifiedProductMedia({
  actor,
  productId,
  storageKey,
  altText,
  contentType,
  width,
  height,
  sourceUrl,
  sha256,
}: {
  actor: CatalogAdminActor;
  productId: string;
  storageKey: string;
  altText: string;
  contentType: string;
  width: number;
  height: number;
  sourceUrl: string;
  sha256: string;
}) {
  assertOwnerRole(actor.role);
  const hearingAidId = identifierSchema.parse(productId);
  const key = uploadedMediaStorageKeySchema.parse(storageKey);
  const accessibleAltText = uploadedMediaAltTextSchema.parse(altText);
  const optimizedContentType = uploadedMediaContentTypeSchema.parse(contentType);
  const imageWidth = uploadedMediaDimensionSchema.parse(width);
  const imageHeight = uploadedMediaDimensionSchema.parse(height);
  const exactSourceUrl = sourceUrlSchema.parse(sourceUrl);
  const digest = uploadedMediaDigestSchema.parse(sha256);
  if (!isPublishableProductMediaKey(key, optimizedContentType, imageWidth, imageHeight)) {
    throw new CatalogManagementError("INVALID_INPUT");
  }

  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const product = await transaction.hearingAid.findUnique({
      where: { id: hearingAidId },
      select: { id: true },
    });
    if (!product) throw new CatalogManagementError("PRODUCT_NOT_FOUND");

    const created = await transaction.productMedia.create({
      data: {
        hearingAidId,
        storageKey: key,
        altText: accessibleAltText,
        contentType: optimizedContentType,
        width: imageWidth,
        height: imageHeight,
        sourceUrl: exactSourceUrl,
        rightsStatus: MediaRightsStatus.UNVERIFIED,
        rightsEvidenceUrl: null,
        rightsNotes: null,
        rightsCheckedAt: null,
        rightsApprovedAt: null,
        rightsApprovedBy: null,
        isPrimary: false,
      },
    });
    await audit(
      transaction,
      owner.id,
      "catalog.media_uploaded_unverified",
      "ProductMedia",
      created.id,
      {
        productId: hearingAidId,
        storageKey: key,
        contentType: optimizedContentType,
        width: imageWidth,
        height: imageHeight,
        sourceUrl: exactSourceUrl,
        sha256: digest,
        rightsStatus: MediaRightsStatus.UNVERIFIED,
        isPrimary: false,
      },
    );
    await maintainProductPublicationInvariant(
      transaction,
      hearingAidId,
      owner.id,
      "media_uploaded_unverified",
    );
    return created;
  }, transactionOptions);
}

export async function createCatalogBrandDraft({
  actor,
  slug,
  name,
  description,
  sortOrder,
}: {
  actor: CatalogAdminActor;
  slug: string;
  name: string;
  description: string;
  sortOrder: string;
}) {
  assertOwnerRole(actor.role);
  const values = {
    slug: brandSlugSchema.parse(slug),
    name: brandNameSchema.parse(name),
    description: optionalText(4000).parse(description),
    sortOrder: sortOrderSchema.parse(sortOrder),
  };
  assertNoCatalogInventoryClaims([values.description]);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const created = await transaction.brand.create({
      data: {
        ...values,
        isPublished: false,
        sourceUrl: null,
        verifiedAt: null,
        verifiedBy: null,
      },
    });
    await audit(transaction, owner.id, "catalog.brand_draft_created", "Brand", created.id, {
      slug: created.slug,
      sortOrder: created.sortOrder,
      isPublished: false,
    });
    return created;
  }, transactionOptions);
}

export async function updateCatalogBrandDraft({
  actor,
  brandId,
  name,
  description,
  sortOrder,
}: {
  actor: CatalogAdminActor;
  brandId: string;
  name: string;
  description: string;
  sortOrder: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(brandId);
  const values = {
    name: brandNameSchema.parse(name),
    description: optionalText(4000).parse(description),
    sortOrder: sortOrderSchema.parse(sortOrder),
  };
  assertNoCatalogInventoryClaims([values.description]);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.brand.findUnique({
      where: { id },
      select: { id: true, isPublished: true, verifiedAt: true, verifiedBy: true },
    });
    if (!before) throw new CatalogManagementError("BRAND_NOT_FOUND");
    const updated = await transaction.brand.update({
      where: { id },
      data: {
        ...values,
        isPublished: false,
        verifiedAt: null,
        verifiedBy: null,
      },
    });
    await audit(transaction, owner.id, "catalog.brand_details_updated", "Brand", id, {
      fields: ["name", "description", "sortOrder"],
      priorPublicationRemoved: before.isPublished,
      priorSourceApprovalRemoved: Boolean(before.verifiedAt || before.verifiedBy),
    });
    return updated;
  }, transactionOptions);
}

export async function createCatalogProductDraft({
  actor,
  brandId,
  slug,
  modelName,
  style,
  sortOrder,
}: {
  actor: CatalogAdminActor;
  brandId: string;
  slug: string;
  modelName: string;
  style: string;
  sortOrder: string;
}) {
  assertOwnerRole(actor.role);
  const exactBrandId = identifierSchema.parse(brandId);
  const values = {
    slug: productSlugSchema.parse(slug),
    modelName: modelNameSchema.parse(modelName),
    style: styleSchema.parse(style),
    sortOrder: sortOrderSchema.parse(sortOrder),
  };
  const unknownFeatures = Object.fromEntries(
    catalogFeatureKeys.map((key) => [key, "unknown"]),
  ) as Prisma.InputJsonObject;
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const brand = await transaction.brand.findUnique({
      where: { id: exactBrandId },
      select: { id: true },
    });
    if (!brand) throw new CatalogManagementError("BRAND_NOT_FOUND");
    const created = await transaction.hearingAid.create({
      data: {
        brandId: exactBrandId,
        ...values,
        features: unknownFeatures,
        status: ProductStatus.DRAFT,
        isFeatured: false,
        consultationRequired: true,
      },
    });
    await audit(transaction, owner.id, "catalog.product_draft_created", "HearingAid", created.id, {
      brandId: exactBrandId,
      slug: created.slug,
      status: ProductStatus.DRAFT,
      featureState: "unknown",
    });
    return created;
  }, transactionOptions);
}

export async function updateCatalogProductDraft({
  actor,
  productId,
  modelName,
  style,
  summary,
  suitableUse,
  rechargeable,
  bluetooth,
  streaming,
  mobileApp,
  hearingLossSuitability,
  noiseManagement,
  warranty,
  fittingInformation,
  afterCare,
  repairSupport,
  consultationRequired,
  priceNote,
  isFeatured,
  sortOrder,
  features,
  specificationsJson,
}: {
  actor: CatalogAdminActor;
  productId: string;
  modelName: string;
  style: string;
  summary: string;
  suitableUse: string;
  rechargeable: TriState;
  bluetooth: TriState;
  streaming: TriState;
  mobileApp: string;
  hearingLossSuitability: string;
  noiseManagement: string;
  warranty: string;
  fittingInformation: string;
  afterCare: string;
  repairSupport: string;
  consultationRequired: boolean;
  priceNote: string;
  isFeatured: boolean;
  sortOrder: string;
  features: Record<string, string>;
  specificationsJson: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(productId);
  const rechargeableState = triStateSchema.parse(rechargeable);
  const bluetoothState = triStateSchema.parse(bluetooth);
  const streamingState = triStateSchema.parse(streaming);
  let specifications: Prisma.InputJsonObject | typeof Prisma.JsonNull;
  try {
    specifications = parseCatalogSpecificationsJson(
      z.string().trim().max(30_000).parse(specificationsJson),
    ) ?? Prisma.JsonNull;
  } catch (error) {
    if (error instanceof CatalogDraftPolicyError && error.code === "INVENTORY_CLAIM") {
      throw new CatalogManagementError("INVENTORY_CLAIM");
    }
    throw error;
  }
  const values = {
    modelName: modelNameSchema.parse(modelName),
    style: styleSchema.parse(style),
    summary: optionalText(6000).parse(summary),
    suitableUse: optionalText(6000).parse(suitableUse),
    rechargeable: triStateBoolean(rechargeableState),
    bluetooth: triStateBoolean(bluetoothState),
    streaming: triStateBoolean(streamingState),
    mobileApp: optionalText(160).parse(mobileApp),
    hearingLossSuitability: optionalText(240).parse(hearingLossSuitability),
    noiseManagement: optionalText(500).parse(noiseManagement),
    warranty: optionalText(500).parse(warranty),
    fittingInformation: optionalText(6000).parse(fittingInformation),
    afterCare: optionalText(6000).parse(afterCare),
    repairSupport: optionalText(6000).parse(repairSupport),
    consultationRequired: z.boolean().parse(consultationRequired),
    priceNote: optionalText(240).parse(priceNote),
    isFeatured: z.boolean().parse(isFeatured),
    sortOrder: sortOrderSchema.parse(sortOrder),
    features: parseFeatureRecord(features),
    specifications,
  };
  assertNoCatalogInventoryClaims([
    values.summary,
    values.suitableUse,
    values.mobileApp,
    values.hearingLossSuitability,
    values.noiseManagement,
    values.warranty,
    values.fittingInformation,
    values.afterCare,
    values.repairSupport,
    values.priceNote,
  ]);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.hearingAid.findUnique({
      where: { id },
      select: {
        id: true,
        brandId: true,
        status: true,
        verifiedAt: true,
        verifiedBy: true,
      },
    });
    if (!before) throw new CatalogManagementError("PRODUCT_NOT_FOUND");
    const nextStatus = statusAfterCatalogFactsEdit(before.status);
    const updated = await transaction.hearingAid.update({
      where: { id },
      data: {
        ...values,
        status: nextStatus,
        verifiedAt: null,
        verifiedBy: null,
      },
    });
    await audit(transaction, owner.id, "catalog.product_details_updated", "HearingAid", id, {
      fields: [
        "modelName", "style", "summary", "suitableUse", "rechargeable", "bluetooth",
        "streaming", "mobileApp", "hearingLossSuitability", "noiseManagement", "warranty",
        "fittingInformation", "afterCare", "repairSupport", "consultationRequired", "priceNote",
        "isFeatured", "sortOrder", "features", "specifications",
      ],
      priorStatus: before.status,
      nextStatus,
      priorSourceApprovalRemoved: Boolean(before.verifiedAt || before.verifiedBy),
    });
    await maintainBrandPublicationInvariant(
      transaction,
      before.brandId,
      owner.id,
      "product_details_updated",
    );
    return updated;
  }, transactionOptions);
}

export async function setCatalogProductArchived({
  actor,
  productId,
  archived,
}: {
  actor: CatalogAdminActor;
  productId: string;
  archived: boolean;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(productId);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.hearingAid.findUnique({
      where: { id },
      select: { id: true, brandId: true, status: true },
    });
    if (!before) throw new CatalogManagementError("PRODUCT_NOT_FOUND");
    const nextStatus = archived ? ProductStatus.ARCHIVED : ProductStatus.DRAFT;
    if (before.status === nextStatus) throw new CatalogManagementError("NO_CHANGE");
    if (!archived && before.status !== ProductStatus.ARCHIVED) {
      throw new CatalogManagementError("INVALID_TRANSITION");
    }
    const updated = await transaction.hearingAid.update({
      where: { id },
      data: { status: nextStatus },
    });
    await audit(
      transaction,
      owner.id,
      archived ? "catalog.product_archived" : "catalog.product_restored_to_draft",
      "HearingAid",
      id,
      { from: before.status, to: nextStatus },
    );
    await maintainBrandPublicationInvariant(
      transaction,
      before.brandId,
      owner.id,
      archived ? "product_archived" : "product_restored",
    );
    return updated;
  }, transactionOptions);
}

export async function confirmBrandSource({
  actor,
  brandId,
  sourceUrl,
}: {
  actor: CatalogAdminActor;
  brandId: string;
  sourceUrl: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(brandId);
  const exactSourceUrl = sourceUrlSchema.parse(sourceUrl);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.brand.findUnique({
      where: { id },
      select: { id: true, sourceUrl: true, verifiedAt: true, verifiedBy: true },
    });
    if (!before) throw new CatalogManagementError("BRAND_NOT_FOUND");
    const verifiedAt = new Date();
    const updated = await transaction.brand.update({
      where: { id },
      data: { sourceUrl: exactSourceUrl, verifiedAt, verifiedBy: owner.email },
    });
    await audit(transaction, owner.id, "catalog.brand_source_confirmed", "Brand", id, {
      sourceUrl: exactSourceUrl,
      priorSourceUrl: before.sourceUrl,
      priorVerificationRecorded: Boolean(before.verifiedAt && before.verifiedBy),
      verifiedBy: owner.email,
    });
    await maintainBrandPublicationInvariant(transaction, id, owner.id, "brand_source_confirmed");
    return updated;
  }, transactionOptions);
}

export async function revokeBrandSource({
  actor,
  brandId,
}: {
  actor: CatalogAdminActor;
  brandId: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(brandId);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.brand.findUnique({
      where: { id },
      select: { id: true, verifiedAt: true, verifiedBy: true },
    });
    if (!before) throw new CatalogManagementError("BRAND_NOT_FOUND");
    if (!before.verifiedAt && !before.verifiedBy) throw new CatalogManagementError("NO_CHANGE");
    const updated = await transaction.brand.update({
      where: { id },
      data: { verifiedAt: null, verifiedBy: null },
    });
    await audit(transaction, owner.id, "catalog.brand_source_revoked", "Brand", id, {
      priorVerifier: before.verifiedBy,
    });
    await maintainBrandPublicationInvariant(transaction, id, owner.id, "brand_source_revoked");
    return updated;
  }, transactionOptions);
}

export async function confirmProductSource({
  actor,
  productId,
  sourceUrl,
}: {
  actor: CatalogAdminActor;
  productId: string;
  sourceUrl: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(productId);
  const exactSourceUrl = sourceUrlSchema.parse(sourceUrl);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.hearingAid.findUnique({
      where: { id },
      select: { id: true, sourceUrl: true, verifiedAt: true, verifiedBy: true },
    });
    if (!before) throw new CatalogManagementError("PRODUCT_NOT_FOUND");
    const updated = await transaction.hearingAid.update({
      where: { id },
      data: { sourceUrl: exactSourceUrl, verifiedAt: new Date(), verifiedBy: owner.email },
    });
    await audit(transaction, owner.id, "catalog.product_source_confirmed", "HearingAid", id, {
      sourceUrl: exactSourceUrl,
      priorSourceUrl: before.sourceUrl,
      priorVerificationRecorded: Boolean(before.verifiedAt && before.verifiedBy),
      verifiedBy: owner.email,
    });
    await maintainProductPublicationInvariant(transaction, id, owner.id, "product_source_confirmed");
    return updated;
  }, transactionOptions);
}

export async function revokeProductSource({
  actor,
  productId,
}: {
  actor: CatalogAdminActor;
  productId: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(productId);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.hearingAid.findUnique({
      where: { id },
      select: { id: true, verifiedAt: true, verifiedBy: true },
    });
    if (!before) throw new CatalogManagementError("PRODUCT_NOT_FOUND");
    if (!before.verifiedAt && !before.verifiedBy) throw new CatalogManagementError("NO_CHANGE");
    const updated = await transaction.hearingAid.update({
      where: { id },
      data: { verifiedAt: null, verifiedBy: null },
    });
    await audit(transaction, owner.id, "catalog.product_source_revoked", "HearingAid", id, {
      priorVerifier: before.verifiedBy,
    });
    await maintainProductPublicationInvariant(transaction, id, owner.id, "product_source_revoked");
    return updated;
  }, transactionOptions);
}

export async function recordProductMediaRights({
  actor,
  mediaId,
  rightsStatus,
  sourceUrl,
  rightsEvidenceUrl,
  rightsNotes,
}: {
  actor: CatalogAdminActor;
  mediaId: string;
  rightsStatus: MediaRightsStatus;
  sourceUrl: string;
  rightsEvidenceUrl: string;
  rightsNotes: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(mediaId);
  const status = z.nativeEnum(MediaRightsStatus).parse(rightsStatus);
  const exactSourceUrl = optionalMediaSourceUrlSchema.parse(sourceUrl);
  const exactEvidenceUrl = optionalEvidenceUrlSchema.parse(rightsEvidenceUrl);
  const notes = optionalRightsNotesSchema.parse(rightsNotes);
  const approved = isApprovedMediaRightsStatus(status);
  if (approved && (!exactSourceUrl || !exactEvidenceUrl)) {
    throw new CatalogManagementError("INVALID_INPUT");
  }

  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.productMedia.findUnique({
      where: { id },
      select: {
        id: true,
        hearingAidId: true,
        storageKey: true,
        rightsStatus: true,
        isPrimary: true,
      },
    });
    if (!before) throw new CatalogManagementError("MEDIA_NOT_FOUND");
    if (isDraftReferenceProductMediaKey(before.storageKey) && status !== MediaRightsStatus.UNVERIFIED) {
      throw new CatalogManagementError("DRAFT_REFERENCE_MEDIA");
    }

    const reviewedAt = new Date();
    const updated = await transaction.productMedia.update({
      where: { id },
      data: {
        sourceUrl: exactSourceUrl,
        rightsStatus: status,
        rightsEvidenceUrl: exactEvidenceUrl,
        rightsNotes: notes,
        rightsCheckedAt: reviewedAt,
        rightsApprovedAt: approved ? reviewedAt : null,
        rightsApprovedBy: approved ? owner.email : null,
      },
    });
    await audit(transaction, owner.id, "catalog.media_rights_reviewed", "ProductMedia", id, {
      productId: before.hearingAidId,
      from: before.rightsStatus,
      to: status,
      assetSourceRecorded: Boolean(exactSourceUrl),
      evidenceRecorded: Boolean(exactEvidenceUrl),
      approvedBy: approved ? owner.email : null,
    });
    await maintainProductPublicationInvariant(transaction, before.hearingAidId, owner.id, "media_rights_reviewed");
    return updated;
  }, transactionOptions);
}

export async function selectPrimaryProductMedia({
  actor,
  mediaId,
}: {
  actor: CatalogAdminActor;
  mediaId: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(mediaId);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const selected = await transaction.productMedia.findUnique({
      where: { id },
      select: { hearingAidId: true, ...mediaGateSelect },
    });
    if (!selected) throw new CatalogManagementError("MEDIA_NOT_FOUND");
    const gate = evaluateProductMediaGate(selected);
    if (!gate.ready) {
      throw new CatalogManagementError(
        isDraftReferenceProductMediaKey(selected.storageKey)
          ? "DRAFT_REFERENCE_MEDIA"
          : "GATE_INCOMPLETE",
        gate.checks.filter((check) => !check.passed).map((check) => check.key),
      );
    }
    const prior = await transaction.productMedia.findMany({
      where: { hearingAidId: selected.hearingAidId, isPrimary: true },
      select: { id: true },
    });
    if (prior.length === 1 && prior[0].id === selected.id) {
      throw new CatalogManagementError("NO_CHANGE");
    }
    await transaction.productMedia.updateMany({
      where: { hearingAidId: selected.hearingAidId, isPrimary: true },
      data: { isPrimary: false },
    });
    const updated = await transaction.productMedia.update({
      where: { id: selected.id },
      data: { isPrimary: true },
    });
    await audit(transaction, owner.id, "catalog.media_primary_selected", "ProductMedia", selected.id, {
      productId: selected.hearingAidId,
      priorPrimaryIds: prior.map((media) => media.id),
    });
    await maintainProductPublicationInvariant(transaction, selected.hearingAidId, owner.id, "primary_media_selected");
    return updated;
  }, transactionOptions);
}

export async function setProductPublication({
  actor,
  productId,
  publish,
}: {
  actor: CatalogAdminActor;
  productId: string;
  publish: boolean;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(productId);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const product = await transaction.hearingAid.findUnique({
      where: { id },
      select: productGateSelect,
    });
    if (!product) throw new CatalogManagementError("PRODUCT_NOT_FOUND");
    const nextStatus = publish ? ProductStatus.PUBLISHED : ProductStatus.DRAFT;
    if (product.status === nextStatus) throw new CatalogManagementError("NO_CHANGE");
    if (product.status === ProductStatus.ARCHIVED) {
      throw new CatalogManagementError("INVALID_TRANSITION");
    }
    if (publish) {
      if (!productPassesInventoryClaimPolicy(product)) {
        throw new CatalogManagementError("INVENTORY_CLAIM");
      }
      const gate = evaluateProductPublicationGate(product);
      if (!gate.ready) {
        throw new CatalogManagementError(
          "GATE_INCOMPLETE",
          gate.checks.filter((check) => !check.passed).map((check) => check.key),
        );
      }
    }
    const updated = await transaction.hearingAid.update({
      where: { id },
      data: { status: nextStatus },
    });
    await audit(
      transaction,
      owner.id,
      publish ? "catalog.product_published" : "catalog.product_unpublished",
      "HearingAid",
      id,
      { from: product.status, to: nextStatus },
    );
    if (!publish) {
      await maintainBrandPublicationInvariant(transaction, product.brandId, owner.id, "product_unpublished");
    }
    return updated;
  }, transactionOptions);
}

export async function setBrandPublication({
  actor,
  brandId,
  publish,
}: {
  actor: CatalogAdminActor;
  brandId: string;
  publish: boolean;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(brandId);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const brand = await transaction.brand.findUnique({
      where: { id },
      select: {
        id: true,
        description: true,
        isPublished: true,
        sourceUrl: true,
        verifiedAt: true,
        verifiedBy: true,
      },
    });
    if (!brand) throw new CatalogManagementError("BRAND_NOT_FOUND");
    if (brand.isPublished === publish) throw new CatalogManagementError("NO_CHANGE");

    const productCount = await getGatePassingPublishedProductCount(transaction, id);
    if (publish) {
      if (!brandPassesInventoryClaimPolicy(brand.description)) {
        throw new CatalogManagementError("INVENTORY_CLAIM");
      }
      const gate = evaluateBrandPublicationGate(brand, productCount);
      if (!gate.ready) {
        throw new CatalogManagementError(
          "GATE_INCOMPLETE",
          gate.checks.filter((check) => !check.passed).map((check) => check.key),
        );
      }
    }
    const updated = await transaction.brand.update({
      where: { id },
      data: { isPublished: publish },
    });
    await audit(
      transaction,
      owner.id,
      publish ? "catalog.brand_published" : "catalog.brand_unpublished",
      "Brand",
      id,
      {
        from: brand.isPublished,
        to: publish,
        gatePassingPublishedProductCount: productCount,
      },
    );
    return updated;
  }, transactionOptions);
}

export function catalogManagementNotice(error: unknown): string {
  if (error instanceof CatalogManagementError) return error.code.toLowerCase();
  if (error instanceof CatalogDraftPolicyError) {
    return error.code === "INVENTORY_CLAIM" ? "inventory_claim" : "invalid_input";
  }
  if (error instanceof z.ZodError) return "invalid_input";
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "duplicate_slug";
  }
  return "change_failed";
}
