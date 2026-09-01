import "server-only";

import { cache } from "react";
import {
  evaluateOfferPublicationGate,
  getReviewedProgramDefinition,
  hasCurrentOwnerApproval,
  isOfferActiveNow,
  type ReviewedProgramKind,
} from "@/lib/admin/offer-gates";
import {
  offerGateInclude,
  toOfferGateInput,
} from "@/lib/admin/offer-management";
import { getApprovedCatalogSnapshot } from "@/lib/catalog/approved-snapshot";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export type PublicOffer = Readonly<{
  id: string;
  slug: string;
  kind: ReviewedProgramKind;
  title: string;
  summary: string;
  maximumDiscountPct: number | null;
  terms: string;
  landingPage: string;
  startsAt: Date;
  endsAt: Date;
  products: readonly Readonly<{
    brandSlug: string;
    brandName: string;
    modelSlug: string;
    modelName: string;
  }>[];
  services: readonly Readonly<{
    slug: string;
    name: string;
  }>[];
}>;

const loadActivePublicOffers = cache(async (): Promise<readonly PublicOffer[]> => {
  if (!isDatabaseConfigured()) return [];
  const now = new Date();
  try {
    const prisma = getPrisma();
    const records = await prisma.offer.findMany({
      where: {
        enabled: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: [{ startsAt: "asc" }, { title: "asc" }],
      include: offerGateInclude,
    });
    const approvalEvidence = records.length
      ? await prisma.auditLog.findMany({
          where: {
            entityType: "Offer",
            entityId: { in: records.map((offer) => offer.id) },
            action: "offer.owner_enabled",
          },
          orderBy: { createdAt: "desc" },
          include: {
            actor: { select: { role: true, active: true, email: true } },
          },
        })
      : [];
    const latestApprovalByOffer = new Map<
      string,
      (typeof approvalEvidence)[number]
    >();
    for (const evidence of approvalEvidence) {
      if (evidence.entityId && !latestApprovalByOffer.has(evidence.entityId)) {
        latestApprovalByOffer.set(evidence.entityId, evidence);
      }
    }

    const approvedCatalog = records.some((offer) => {
      const definition = getReviewedProgramDefinition(offer.slug);
      return offer.hearingAids.length > 0 || definition?.requiresApprovedCatalog;
    })
      ? await getApprovedCatalogSnapshot()
      : null;
    const approvedModelKeys = new Set<string>(
      approvedCatalog?.models.map((model) => model.key) ?? [],
    );

    return records.flatMap((offer): PublicOffer[] => {
      const definition = getReviewedProgramDefinition(offer.slug);
      const gate = evaluateOfferPublicationGate(toOfferGateInput(offer));
      const hasApprovedMappedProducts =
        offer.hearingAids.length === 0 ||
        (approvedCatalog !== null &&
          offer.hearingAids.every(({ hearingAid }) =>
            approvedModelKeys.has(`${hearingAid.brand.slug}~${hearingAid.slug}`),
          ));
      const hasRequiredCatalog = !definition?.requiresApprovedCatalog || approvedCatalog !== null;
      const hasOwnerApproval = hasCurrentOwnerApproval({
        offerId: offer.id,
        offerUpdatedAt: offer.updatedAt,
        evidence: latestApprovalByOffer.get(offer.id),
      });
      if (
        !definition ||
        !gate.ready ||
        !hasApprovedMappedProducts ||
        !hasRequiredCatalog ||
        !hasOwnerApproval ||
        !isOfferActiveNow(offer, now) ||
        !offer.summary ||
        !offer.terms ||
        !offer.landingPage ||
        !offer.startsAt ||
        !offer.endsAt
      ) {
        return [];
      }

      return [
        {
          id: offer.id,
          slug: offer.slug,
          kind: definition.kind,
          title: offer.title,
          summary: offer.summary,
          maximumDiscountPct: offer.maximumDiscountPct,
          terms: offer.terms,
          landingPage: offer.landingPage,
          startsAt: offer.startsAt,
          endsAt: offer.endsAt,
          products: offer.hearingAids.map(({ hearingAid }) => ({
            brandSlug: hearingAid.brand.slug,
            brandName: hearingAid.brand.name,
            modelSlug: hearingAid.slug,
            modelName: hearingAid.modelName,
          })),
          services: offer.services.map(({ service }) => ({
            slug: service.slug,
            name: service.name,
          })),
        },
      ];
    });
  } catch {
    return [];
  }
});

export async function getActivePublicOffers(): Promise<readonly PublicOffer[]> {
  return loadActivePublicOffers();
}

export async function getActivePublicOffer(slug: string): Promise<PublicOffer | null> {
  const offers = await getActivePublicOffers();
  return offers.find((offer) => offer.slug === slug) ?? null;
}
