export type VerificationStatus = "verified";

export interface ExpertProfile {
  slug: string;
  name: string;
  professionalTitle: string;
  qualifications: readonly string[];
  registration: {
    authority: string;
    number: string;
    verifiedAt: string;
  };
  languages: readonly string[];
  scopeOfPractice: readonly string[];
  profileImage: {
    src: string;
    alt: string;
    publicationConsentRecordedAt: string;
  };
  biography: readonly string[];
  profileVerifiedAt: string;
  status: VerificationStatus;
}

/**
 * Only people whose identity, qualifications, active registration, image consent,
 * and public biography have been checked belong in this registry. An empty registry
 * is intentional until those facts are supplied and verified.
 */
export const verifiedExpertProfiles: readonly ExpertProfile[] = [];

export function getVerifiedExpertProfile(slug: string) {
  return verifiedExpertProfiles.find(
    (profile) => profile.slug === slug && profile.status === "verified",
  );
}

export type OfferStockStatus = "in_stock" | "limited" | "out_of_stock" | "quote_required";

export interface OfferProductTerm {
  sku: string;
  modelName: string;
  mrpInr: number;
  campaignPriceInr: number;
  stockStatus: OfferStockStatus;
  fittingIncluded: boolean;
  warrantySummary: string;
}

export interface OfferTerms {
  campaignName: string;
  publicClaim: string;
  campaignStartsAt: string | null;
  campaignEndsAt: string | null;
  approvedAt: string | null;
  eligibleProducts: readonly OfferProductTerm[];
  inclusions: readonly string[];
  exclusions: readonly string[];
  quoteValidityNote: string;
  verificationState: "awaiting_business_confirmation" | "approved";
}

/**
 * Audiosen has not supplied an approved model-level price schedule for publication.
 * This record deliberately contains no SKU, MRP, campaign price, stock, or date claim.
 */
export const publicOfferTerms: OfferTerms = {
  campaignName: "Audiosen hearing-aid savings enquiry",
  publicClaim: "Ask for the current model-specific savings in a complete written quote.",
  campaignStartsAt: null,
  campaignEndsAt: null,
  approvedAt: null,
  eligibleProducts: [],
  inclusions: [
    "The model-specific device price shown in the written quote",
    "Any fitting, programming, accessories, warranty, or follow-up explicitly listed in that quote",
  ],
  exclusions: [
    "Products, services, accessories, or visits not named in the written quote",
    "Any percentage discount that is not documented for the named model",
    "Combining discounts unless the written quote expressly allows it",
  ],
  quoteValidityNote:
    "The written quote must state the exact model, MRP basis, campaign price, stock status, inclusions, warranty, validity period, and any cancellation or refund terms.",
  verificationState: "awaiting_business_confirmation",
};
