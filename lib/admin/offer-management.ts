import { AdminRole, Prisma } from "@prisma/client";
import { z } from "zod";
import {
  evaluateOfferPublicationGate,
  getReviewedProgramDefinition,
  type OfferGateInput,
} from "@/lib/admin/offer-gates";
import { getPrisma } from "@/lib/db";

export type OfferAdminActor = Readonly<{
  id: string;
  email: string;
  role: AdminRole;
}>;

export type OfferManagementCode =
  | "OWNER_REQUIRED"
  | "OFFER_NOT_FOUND"
  | "INVALID_INPUT"
  | "NO_CHANGE"
  | "GATE_INCOMPLETE";

export class OfferManagementError extends Error {
  constructor(
    public readonly code: OfferManagementCode,
    public readonly failedChecks: readonly string[] = [],
  ) {
    super(code);
    this.name = "OfferManagementError";
  }
}

const identifierSchema = z.string().uuid();
const identifierListSchema = z.array(identifierSchema).max(100).transform((values) => [...new Set(values)]);
const slugSchema = z.string().trim().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const titleSchema = z.string().trim().min(3).max(180);
const nullableSummarySchema = z.string().trim().max(4000).transform((value) => value || null);
const nullableTermsSchema = z.string().trim().max(20_000).transform((value) => value || null);
const maximumDiscountSchema = z.coerce.number().int().min(1).max(100);
const localDateTimeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .transform((value) => new Date(`${value}:00+05:30`))
  .refine((value) => !Number.isNaN(value.getTime()));

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

export const offerGateInclude = {
  hearingAids: {
    include: {
      hearingAid: {
        include: {
          brand: { select: { slug: true, name: true } },
          media: { select: mediaGateSelect },
        },
      },
    },
  },
  services: { include: { service: true } },
  brands: { include: { brand: true } },
} satisfies Prisma.OfferInclude;

export type OfferWithGateRelations = Prisma.OfferGetPayload<{
  include: typeof offerGateInclude;
}>;

const transactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;

function requireReviewedProgramDefinition(slug: string) {
  const definition = getReviewedProgramDefinition(slug);
  if (!definition) throw new OfferManagementError("INVALID_INPUT");
  return definition;
}

function parseMaximumDiscount(slug: string, value: string): number | null {
  const definition = requireReviewedProgramDefinition(slug);
  const normalized = value.trim();
  if (definition.exactDiscountPct === null) {
    if (normalized) throw new OfferManagementError("INVALID_INPUT");
    return null;
  }
  const discount = maximumDiscountSchema.parse(normalized);
  if (discount !== definition.exactDiscountPct) {
    throw new OfferManagementError("INVALID_INPUT");
  }
  return discount;
}

function assertOwnerRole(role: AdminRole): void {
  if (role !== AdminRole.OWNER) throw new OfferManagementError("OWNER_REQUIRED");
}

async function requireCurrentOwner(
  transaction: Prisma.TransactionClient,
  actor: OfferAdminActor,
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
    throw new OfferManagementError("OWNER_REQUIRED");
  }
  return current;
}

async function audit(
  transaction: Prisma.TransactionClient,
  actorId: string,
  action: string,
  offerId: string,
  metadata: Prisma.InputJsonObject,
): Promise<void> {
  await transaction.auditLog.create({
    // Set this application-side after the preceding mutation. PostgreSQL's
    // transaction-scoped `now()` can otherwise predate Prisma's `@updatedAt`
    // value and make a valid fresh approval look stale to the public gate.
    data: {
      actorId,
      action,
      entityType: "Offer",
      entityId: offerId,
      metadata,
      createdAt: new Date(),
    },
  });
}

export function toOfferGateInput(offer: OfferWithGateRelations): OfferGateInput {
  return {
    slug: offer.slug,
    title: offer.title,
    summary: offer.summary,
    maximumDiscountPct: offer.maximumDiscountPct,
    terms: offer.terms,
    landingPage: offer.landingPage,
    startsAt: offer.startsAt,
    endsAt: offer.endsAt,
    products: offer.hearingAids.map(({ hearingAid }) => ({
      id: hearingAid.id,
      status: hearingAid.status,
      sourceUrl: hearingAid.sourceUrl,
      verifiedAt: hearingAid.verifiedAt,
      verifiedBy: hearingAid.verifiedBy,
      media: hearingAid.media,
    })),
    services: offer.services.map(({ service }) => ({
      id: service.id,
      status: service.status,
      sourceUrl: service.sourceUrl,
      verifiedAt: service.verifiedAt,
      verifiedBy: service.verifiedBy,
    })),
    brands: offer.brands.map(({ brand }) => ({
      id: brand.id,
      isPublished: brand.isPublished,
      sourceUrl: brand.sourceUrl,
      verifiedAt: brand.verifiedAt,
      verifiedBy: brand.verifiedBy,
    })),
  };
}

async function loadOfferForGate(
  transaction: Prisma.TransactionClient,
  offerId: string,
): Promise<OfferWithGateRelations> {
  const offer = await transaction.offer.findUnique({
    where: { id: offerId },
    include: offerGateInclude,
  });
  if (!offer) throw new OfferManagementError("OFFER_NOT_FOUND");
  return offer;
}

export async function createOfferDraft({
  actor,
  slug,
  title,
}: {
  actor: OfferAdminActor;
  slug: string;
  title: string;
}) {
  assertOwnerRole(actor.role);
  const exactSlug = slugSchema.parse(slug);
  const definition = requireReviewedProgramDefinition(exactSlug);
  const requestedTitle = titleSchema.parse(title);
  const exactTitle = definition.kind === "campaign"
    ? definition.defaultTitle
    : requestedTitle;
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const offer = await transaction.offer.create({
      data: {
        slug: exactSlug,
        title: exactTitle,
        landingPage: definition.canonicalPath,
        enabled: false,
      },
    });
    await audit(transaction, owner.id, "offer.draft_created", offer.id, {
      slug: exactSlug,
      landingPage: definition.canonicalPath,
      programKind: definition.kind,
      enabled: false,
    });
    return offer;
  }, transactionOptions);
}

export async function updateOfferDetails({
  actor,
  offerId,
  title,
  summary,
  maximumDiscountPct,
  terms,
  startsAt,
  endsAt,
}: {
  actor: OfferAdminActor;
  offerId: string;
  title: string;
  summary: string;
  maximumDiscountPct: string;
  terms: string;
  startsAt: string;
  endsAt: string;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(offerId);
  const baseValues = {
    title: titleSchema.parse(title),
    summary: nullableSummarySchema.parse(summary),
    terms: nullableTermsSchema.parse(terms),
    startsAt: localDateTimeSchema.parse(startsAt),
    endsAt: localDateTimeSchema.parse(endsAt),
  };
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.offer.findUnique({
      where: { id },
      select: { id: true, slug: true, enabled: true },
    });
    if (!before) throw new OfferManagementError("OFFER_NOT_FOUND");
    const definition = requireReviewedProgramDefinition(before.slug);
    const exactMaximumDiscountPct = parseMaximumDiscount(
      before.slug,
      maximumDiscountPct,
    );
    const updated = await transaction.offer.update({
      where: { id },
      data: {
        ...baseValues,
        title: definition.kind === "campaign"
          ? definition.defaultTitle
          : baseValues.title,
        maximumDiscountPct: exactMaximumDiscountPct,
        landingPage: definition.canonicalPath,
        enabled: false,
      },
    });
    await audit(transaction, owner.id, "offer.details_updated", id, {
      fields: [
        "title",
        "summary",
        "maximumDiscountPct",
        "terms",
        "startsAt",
        "endsAt",
        "landingPage",
      ],
      programKind: definition.kind,
      landingPage: definition.canonicalPath,
      automaticallyDisabled: before.enabled,
    });
    return updated;
  }, transactionOptions);
}

export async function updateOfferMappings({
  actor,
  offerId,
  brandIds,
  productIds,
  serviceIds,
}: {
  actor: OfferAdminActor;
  offerId: string;
  brandIds: string[];
  productIds: string[];
  serviceIds: string[];
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(offerId);
  const brands = identifierListSchema.parse(brandIds);
  const products = identifierListSchema.parse(productIds);
  const services = identifierListSchema.parse(serviceIds);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await transaction.offer.findUnique({
      where: { id },
      select: { id: true, enabled: true },
    });
    if (!before) throw new OfferManagementError("OFFER_NOT_FOUND");

    const [brandCount, productCount, serviceCount] = await Promise.all([
      brands.length ? transaction.brand.count({ where: { id: { in: brands } } }) : 0,
      products.length ? transaction.hearingAid.count({ where: { id: { in: products } } }) : 0,
      services.length ? transaction.service.count({ where: { id: { in: services } } }) : 0,
    ]);
    if (
      brandCount !== brands.length ||
      productCount !== products.length ||
      serviceCount !== services.length
    ) {
      throw new OfferManagementError("INVALID_INPUT");
    }

    await transaction.offer.update({ where: { id }, data: { enabled: false } });
    await Promise.all([
      transaction.offerBrand.deleteMany({ where: { offerId: id } }),
      transaction.offerHearingAid.deleteMany({ where: { offerId: id } }),
      transaction.offerService.deleteMany({ where: { offerId: id } }),
    ]);
    if (brands.length) {
      await transaction.offerBrand.createMany({
        data: brands.map((brandId) => ({ offerId: id, brandId })),
      });
    }
    if (products.length) {
      await transaction.offerHearingAid.createMany({
        data: products.map((hearingAidId) => ({ offerId: id, hearingAidId })),
      });
    }
    if (services.length) {
      await transaction.offerService.createMany({
        data: services.map((serviceId) => ({ offerId: id, serviceId })),
      });
    }
    await audit(transaction, owner.id, "offer.mappings_updated", id, {
      brandIds: brands,
      productIds: products,
      serviceIds: services,
      automaticallyDisabled: before.enabled,
    });
  }, transactionOptions);
}

export async function setOfferEnabled({
  actor,
  offerId,
  enabled,
}: {
  actor: OfferAdminActor;
  offerId: string;
  enabled: boolean;
}) {
  assertOwnerRole(actor.role);
  const id = identifierSchema.parse(offerId);
  return getPrisma().$transaction(async (transaction) => {
    const owner = await requireCurrentOwner(transaction, actor);
    const before = await loadOfferForGate(transaction, id);
    if (before.enabled === enabled) throw new OfferManagementError("NO_CHANGE");

    let failedChecks: string[] = [];
    if (enabled) {
      const gate = evaluateOfferPublicationGate(toOfferGateInput(before));
      failedChecks = gate.checks.filter((check) => !check.passed).map((check) => check.key);
      if (!gate.ready) throw new OfferManagementError("GATE_INCOMPLETE", failedChecks);
    }

    const updated = await transaction.offer.update({
      where: { id },
      data: { enabled },
    });
    await audit(transaction, owner.id, enabled ? "offer.owner_enabled" : "offer.owner_disabled", id, {
      enabled,
      ownerEmail: owner.email,
      confirmedAt: new Date().toISOString(),
      programKind: getReviewedProgramDefinition(before.slug)?.kind ?? "unsupported",
      landingPage: before.landingPage,
      approvedOfferUpdatedAt: enabled ? updated.updatedAt.toISOString() : null,
      maximumDiscountPct: before.maximumDiscountPct,
      startsAt: before.startsAt?.toISOString() ?? null,
      endsAt: before.endsAt?.toISOString() ?? null,
      productIds: before.hearingAids.map(({ hearingAidId }) => hearingAidId),
      serviceIds: before.services.map(({ serviceId }) => serviceId),
      brandIds: before.brands.map(({ brandId }) => brandId),
    });
    return updated;
  }, transactionOptions);
}

export function offerManagementNotice(error: unknown): string {
  if (error instanceof OfferManagementError) {
    return error.code.toLowerCase();
  }
  if (error instanceof z.ZodError) return "invalid_input";
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "slug_exists";
  }
  return "change_failed";
}

export function offerStatusLabel(offer: { enabled: boolean; startsAt: Date | null; endsAt: Date | null }, now = new Date()): string {
  if (!offer.enabled) return "Draft / disabled";
  if (offer.startsAt && now < offer.startsAt) return "Approved / scheduled";
  if (offer.endsAt && now > offer.endsAt) return "Expired / disabled publicly";
  return "Active window";
}
