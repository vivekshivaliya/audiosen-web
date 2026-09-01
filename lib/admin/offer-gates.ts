import { AdminRole, ProductStatus } from "@prisma/client";
import {
  evaluateProductPublicationGate,
  isConfirmedHttpsUrl,
  isOwnerIdentity,
  type ProductPublicationGateInput,
} from "@/lib/admin/catalog-gates";

export type OfferGateCheck = Readonly<{
  key: string;
  label: string;
  passed: boolean;
}>;

export type OfferGateProduct = ProductPublicationGateInput &
  Readonly<{
    id: string;
    status: ProductStatus;
  }>;

export type OfferGateService = Readonly<{
  id: string;
  status: ProductStatus;
  sourceUrl: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
}>;

export type OfferGateBrand = Readonly<{
  id: string;
  isPublished: boolean;
  sourceUrl: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
}>;

export type OfferGateInput = Readonly<{
  slug: string;
  title: string;
  summary: string | null;
  maximumDiscountPct: number | null;
  terms: string | null;
  landingPage: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  products: readonly OfferGateProduct[];
  services: readonly OfferGateService[];
  brands: readonly OfferGateBrand[];
}>;

export type OfferGateResult = Readonly<{
  ready: boolean;
  checks: readonly OfferGateCheck[];
}>;

export type OfferOwnerApprovalEvidence = Readonly<{
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
  actor: Readonly<{
    role: AdminRole;
    active: boolean;
    email: string;
  }> | null;
}>;

export const reviewedProgramDefinitions = {
  "50-percent-off": {
    kind: "campaign",
    canonicalPath: "/offers/50-percent-off",
    defaultTitle: "Eligible for Up to 50% Off",
    exactDiscountPct: 50,
    requiresApprovedCatalog: true,
  },
  "hearing-aid-rental": {
    kind: "rental",
    canonicalPath: "/hearing-aid-rental",
    defaultTitle: "Hearing aid rental program",
    exactDiscountPct: null,
    requiresApprovedCatalog: false,
  },
  "care-plans": {
    kind: "care_plan",
    canonicalPath: "/care-plans",
    defaultTitle: "Hearing aid care plans",
    exactDiscountPct: null,
    requiresApprovedCatalog: false,
  },
  "hearing-aid-trial": {
    kind: "trial",
    canonicalPath: "/hearing-aid-trial",
    defaultTitle: "Assessment-led hearing aid trial program",
    exactDiscountPct: null,
    // This path is already protected as a catalog surface. Requiring the full
    // approved snapshot keeps a DB program from bypassing that release gate.
    requiresApprovedCatalog: true,
  },
} as const;

export type ReviewedProgramSlug = keyof typeof reviewedProgramDefinitions;
export type ReviewedProgramKind =
  (typeof reviewedProgramDefinitions)[ReviewedProgramSlug]["kind"];

export function getReviewedProgramDefinition(slug: string) {
  if (!Object.prototype.hasOwnProperty.call(reviewedProgramDefinitions, slug)) return null;
  return reviewedProgramDefinitions[slug as ReviewedProgramSlug];
}

export function hasCurrentOwnerApproval({
  offerId,
  offerUpdatedAt,
  evidence,
}: {
  offerId: string;
  offerUpdatedAt: Date;
  evidence: OfferOwnerApprovalEvidence | null | undefined;
}): boolean {
  const metadata = evidence?.metadata;
  const approvedOfferUpdatedAt =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).approvedOfferUpdatedAt
      : null;
  return Boolean(
    evidence &&
      evidence.action === "offer.owner_enabled" &&
      evidence.entityType === "Offer" &&
      evidence.entityId === offerId &&
      isValidDate(evidence.createdAt) &&
      evidence.createdAt >= offerUpdatedAt &&
      approvedOfferUpdatedAt === offerUpdatedAt.toISOString() &&
      evidence.actor?.active &&
      evidence.actor.role === AdminRole.OWNER &&
      isOwnerIdentity(evidence.actor.email),
  );
}

function isValidDate(value: Date | null): value is Date {
  return Boolean(value && !Number.isNaN(value.getTime()));
}

function serviceIsVerified(service: OfferGateService): boolean {
  return Boolean(
    service.status === ProductStatus.PUBLISHED &&
      isConfirmedHttpsUrl(service.sourceUrl) &&
      isValidDate(service.verifiedAt) &&
      isOwnerIdentity(service.verifiedBy),
  );
}

function brandIsVerified(brand: OfferGateBrand): boolean {
  return Boolean(
    brand.isPublished &&
      isConfirmedHttpsUrl(brand.sourceUrl) &&
      isValidDate(brand.verifiedAt) &&
      isOwnerIdentity(brand.verifiedBy),
  );
}

function hasExplicitTermsClause(terms: string | null, clause: string): boolean {
  if (!terms) return false;
  const escapedClause = clause.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\n)\\s*${escapedClause}\\s*:\\s*\\S.{2,}$`, "im").test(terms);
}

function containsProhibitedCommercialClaim(value: string): boolean {
  return [
    /\blimited stock\b/i,
    /\bwhile stocks? last(?:s)?\b/i,
    /\bonly\s+\d+\s+(?:devices?|units?|items?)?\s*left\b/i,
    /\b(?:hurry|last chance|countdown|ends soon|today only)\b/i,
    /\bguaranteed\s+(?:availability|results?|outcomes?|savings?|discount)\b/i,
    /\brisk[- ]free\b/i,
  ].some((pattern) => pattern.test(value));
}

function containsDiscountClaim(value: string): boolean {
  return Boolean(
    /\bdiscount(?:ed|s)?\b/i.test(value) ||
      /\bup\s+to\s+\d{1,3}\s*(?:%|percent)\b/i.test(value) ||
      /\b\d{1,3}\s*(?:%|percent)\s*(?:off|discount)\b/i.test(value),
  );
}

export function evaluateOfferPublicationGate(offer: OfferGateInput): OfferGateResult {
  const definition = getReviewedProgramDefinition(offer.slug);
  const startsAtValid = isValidDate(offer.startsAt);
  const endsAtValid = isValidDate(offer.endsAt);
  const datesOrdered = Boolean(
    startsAtValid && endsAtValid && offer.startsAt && offer.endsAt && offer.endsAt > offer.startsAt,
  );
  const exactMappings = offer.products.length + offer.services.length;
  const isFiftyPercentCampaign = offer.slug === "50-percent-off";
  const requiredTermsClauses = [
    "Pricing",
    "Deposit",
    "Warranty",
    "Trial applicability",
    "Eligibility",
    "Dates",
  ];
  const publicCopy = [offer.title, offer.summary ?? "", offer.terms ?? ""].join("\n");
  const checks: OfferGateCheck[] = [
    {
      key: "identity",
      label: "A stable slug and public title are recorded",
      passed:
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(offer.slug) && offer.title.trim().length >= 3,
    },
    {
      key: "summary",
      label: "A clear campaign summary is recorded",
      passed: Boolean(offer.summary && offer.summary.trim().length >= 20),
    },
    {
      key: "bounded_discount_wording",
      label: "The 50% campaign uses the exact eligibility-bounded public title",
      passed: !isFiftyPercentCampaign || offer.title.trim() === "Eligible for Up to 50% Off",
    },
    {
      key: "non_discount_program_copy",
      label: "Rental, care-plan and trial copy contains no discount claim",
      passed: isFiftyPercentCampaign || !containsDiscountClaim(publicCopy),
    },
    {
      key: "commercial_claim_safety",
      label: "Public copy contains no stock, scarcity, countdown or guarantee claim",
      passed: !containsProhibitedCommercialClaim(publicCopy),
    },
    {
      key: "maximum_discount",
      label: definition?.exactDiscountPct === null
        ? "No discount percentage is recorded for this non-discount program"
        : "The 50% campaign records an exact maximum discount of 50%",
      passed: definition
        ? offer.maximumDiscountPct === definition.exactDiscountPct
        : false,
    },
    {
      key: "written_terms",
      label: "Substantive written commercial terms are recorded",
      passed: Boolean(offer.terms && offer.terms.trim().length >= 120),
    },
    ...requiredTermsClauses.map((clause) => ({
      key: `terms_${clause.toLowerCase().replace(/\s+/g, "_")}`,
      label: `Written terms explicitly answer “${clause}:” (including “not applicable” when accurate)`,
      passed: hasExplicitTermsClause(offer.terms, clause),
    })),
    {
      key: "campaign_dates",
      label: "Exact start and end instants are recorded in order",
      passed: datesOrdered,
    },
    {
      key: "landing_page",
      label: "The program uses its reviewed exact canonical landing page",
      passed: Boolean(definition && offer.landingPage === definition.canonicalPath),
    },
    {
      key: "supported_surface",
      label: "The program uses one of the four reviewed V1 public surfaces",
      passed: definition !== null,
    },
    {
      key: "exact_eligibility",
      label: "At least one exact product or service is mapped (a brand alone is not sufficient)",
      passed: exactMappings > 0,
    },
    {
      key: "discount_device_eligibility",
      label: "The 50% campaign maps at least one exact device and no services",
      passed: !isFiftyPercentCampaign || (offer.products.length > 0 && offer.services.length === 0),
    },
    {
      key: "eligible_products",
      label: "Every mapped product is published and passes the source/media publication gate",
      passed: offer.products.every(
        (product) =>
          product.status === ProductStatus.PUBLISHED &&
          evaluateProductPublicationGate(product).ready,
      ),
    },
    {
      key: "eligible_services",
      label: "Every mapped service is published and Owner-source-verified",
      passed: offer.services.every(serviceIsVerified),
    },
    {
      key: "mapped_brands",
      label: "Every optional mapped brand is published and Owner-source-verified",
      passed: offer.brands.every(brandIsVerified),
    },
  ];
  return { ready: checks.every((check) => check.passed), checks };
}

export function isOfferActiveNow(
  offer: Pick<OfferGateInput, "startsAt" | "endsAt"> & { enabled: boolean },
  now = new Date(),
): boolean {
  return Boolean(
    offer.enabled &&
      isValidDate(offer.startsAt) &&
      isValidDate(offer.endsAt) &&
      offer.startsAt <= now &&
      offer.endsAt >= now,
  );
}
