import { AdminRole, MediaRightsStatus, ProductStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  evaluateOfferPublicationGate,
  getReviewedProgramDefinition,
  hasCurrentOwnerApproval,
  isOfferActiveNow,
} from "@/lib/admin/offer-gates";

const approvedMedia = {
  id: "media-1",
  storageKey: "catalog/2026/08/12345678-1234-4123-8123-123456789abc.webp",
  altText: "Approved hearing aid product image",
  contentType: "image/webp",
  width: 1200,
  height: 1200,
  isPrimary: true,
  sourceUrl: "https://manufacturer.example/assets/model",
  rightsStatus: MediaRightsStatus.MANUFACTURER_AUTHORIZED,
  rightsEvidenceUrl: "https://manufacturer.example/rights/model",
  rightsCheckedAt: new Date("2026-08-20T00:00:00.000Z"),
  rightsApprovedAt: new Date("2026-08-21T00:00:00.000Z"),
  rightsApprovedBy: "owner@audiosen.com",
};

const approvedProduct = {
  id: "product-1",
  status: ProductStatus.PUBLISHED,
  sourceUrl: "https://manufacturer.example/models/model",
  verifiedAt: new Date("2026-08-21T00:00:00.000Z"),
  verifiedBy: "owner@audiosen.com",
  media: [approvedMedia],
};

const approvedService = {
  id: "service-1",
  status: ProductStatus.PUBLISHED,
  sourceUrl: "https://audiosen.com/services/approved-service-source",
  verifiedAt: new Date("2026-08-21T00:00:00.000Z"),
  verifiedBy: "owner@audiosen.com",
};

const completeOffer = {
  slug: "50-percent-off",
  title: "Eligible for Up to 50% Off",
  summary: "A date-bound offer for the exact hearing-aid models listed below.",
  maximumDiscountPct: 50,
  terms:
    "Pricing: The written quote states the actual price and saving before offline payment.\nDeposit: The written quote states whether a deposit applies.\nWarranty: The mapped device warranty terms are stated in writing.\nTrial applicability: No trial is included unless the written quote says otherwise.\nEligibility: Only the exact mapped models below qualify.\nDates: Eligibility applies only between the recorded start and end instants.",
  landingPage: "/offers/50-percent-off",
  startsAt: new Date("2026-09-01T00:00:00.000Z"),
  endsAt: new Date("2026-09-30T23:59:59.000Z"),
  products: [approvedProduct],
  services: [],
  brands: [],
};

describe("offer publication gates", () => {
  it("accepts a complete, exactly mapped campaign", () => {
    expect(evaluateOfferPublicationGate(completeOffer).ready).toBe(true);
  });

  it("rejects a brand-only campaign because eligibility is not exact", () => {
    const result = evaluateOfferPublicationGate({
      ...completeOffer,
      products: [],
      brands: [
        {
          id: "brand-1",
          isPublished: true,
          sourceUrl: "https://manufacturer.example/",
          verifiedAt: new Date("2026-08-21T00:00:00.000Z"),
          verifiedBy: "owner@audiosen.com",
        },
      ],
    });
    expect(result.ready).toBe(false);
    expect(result.checks.find((check) => check.key === "exact_eligibility")?.passed).toBe(false);
  });

  it("rejects a service-only or mixed-service 50% campaign and requires the approved catalog", () => {
    const serviceOnly = evaluateOfferPublicationGate({
      ...completeOffer,
      products: [],
      services: [approvedService],
    });
    expect(serviceOnly.ready).toBe(false);
    expect(
      serviceOnly.checks.find((check) => check.key === "discount_device_eligibility")?.passed,
    ).toBe(false);

    const mixed = evaluateOfferPublicationGate({
      ...completeOffer,
      services: [approvedService],
    });
    expect(mixed.ready).toBe(false);
    expect(
      mixed.checks.find((check) => check.key === "discount_device_eligibility")?.passed,
    ).toBe(false);
    expect(getReviewedProgramDefinition("50-percent-off")?.requiresApprovedCatalog).toBe(true);
  });

  it("rejects unapproved product media and incomplete terms", () => {
    const result = evaluateOfferPublicationGate({
      ...completeOffer,
      terms: "Conditions apply.",
      products: [
        {
          ...approvedProduct,
          media: [{ ...approvedMedia, rightsEvidenceUrl: null }],
        },
      ],
    });
    expect(result.ready).toBe(false);
    expect(result.checks.find((check) => check.key === "written_terms")?.passed).toBe(false);
    expect(result.checks.find((check) => check.key === "eligible_products")?.passed).toBe(false);
  });

  it("rejects missing, reversed, or ambiguous campaign dates", () => {
    expect(evaluateOfferPublicationGate({ ...completeOffer, startsAt: null }).ready).toBe(false);
    expect(
      evaluateOfferPublicationGate({
        ...completeOffer,
        startsAt: new Date("2026-10-01T00:00:00.000Z"),
      }).ready,
    ).toBe(false);
  });

  it("withholds an unreviewed campaign slug even when its other facts are complete", () => {
    const result = evaluateOfferPublicationGate({
      ...completeOffer,
      slug: "summer-campaign",
      landingPage: "/offers/summer-campaign",
    });
    expect(result.ready).toBe(false);
    expect(result.checks.find((check) => check.key === "supported_surface")?.passed).toBe(false);
  });

  it.each([
    ["hearing-aid-rental", "/hearing-aid-rental"],
    ["care-plans", "/care-plans"],
    ["hearing-aid-trial", "/hearing-aid-trial"],
  ])("accepts the reviewed %s program only without a discount", (slug, landingPage) => {
    const result = evaluateOfferPublicationGate({
      ...completeOffer,
      slug,
      title: "Approved hearing care program",
      landingPage,
      maximumDiscountPct: null,
    });
    expect(result.ready).toBe(true);
    expect(result.checks.find((check) => check.key === "maximum_discount")?.passed).toBe(true);

    const misleadingDiscount = evaluateOfferPublicationGate({
      ...completeOffer,
      slug,
      title: "Approved hearing care program",
      landingPage,
      maximumDiscountPct: 10,
    });
    expect(misleadingDiscount.ready).toBe(false);
    expect(
      misleadingDiscount.checks.find((check) => check.key === "maximum_discount")?.passed,
    ).toBe(false);
  });

  it("requires the 50% campaign value and its exact canonical path", () => {
    expect(evaluateOfferPublicationGate({ ...completeOffer, maximumDiscountPct: 49 }).ready).toBe(false);
    expect(
      evaluateOfferPublicationGate({ ...completeOffer, landingPage: "/hearing-aid-rental" }).ready,
    ).toBe(false);
  });

  it("requires bounded campaign wording and rejects unsafe commercial claims", () => {
    const unbounded = evaluateOfferPublicationGate({
      ...completeOffer,
      title: "50% off everything",
    });
    expect(unbounded.ready).toBe(false);
    expect(
      unbounded.checks.find((check) => check.key === "bounded_discount_wording")?.passed,
    ).toBe(false);

    const scarcity = evaluateOfferPublicationGate({
      ...completeOffer,
      summary: "Limited stock: hurry, only 3 devices left in this campaign.",
    });
    expect(scarcity.ready).toBe(false);
    expect(
      scarcity.checks.find((check) => check.key === "commercial_claim_safety")?.passed,
    ).toBe(false);
  });

  it("requires every explicit commercial-terms clause", () => {
    const missingDeposit = evaluateOfferPublicationGate({
      ...completeOffer,
      terms: completeOffer.terms.replace("Deposit:", "Payment condition:"),
    });
    expect(missingDeposit.ready).toBe(false);
    expect(missingDeposit.checks.find((check) => check.key === "terms_deposit")?.passed).toBe(false);
  });

  it("accepts only a current approval by an active Owner", () => {
    const offerUpdatedAt = new Date("2026-08-22T10:00:00.000Z");
    const evidence = {
      action: "offer.owner_enabled",
      entityType: "Offer",
      entityId: "offer-1",
      metadata: { approvedOfferUpdatedAt: offerUpdatedAt.toISOString() },
      createdAt: new Date("2026-08-22T10:00:01.000Z"),
      actor: {
        role: AdminRole.OWNER,
        active: true,
        email: "owner@audiosen.com",
      },
    };
    expect(hasCurrentOwnerApproval({ offerId: "offer-1", offerUpdatedAt, evidence })).toBe(true);
    expect(
      hasCurrentOwnerApproval({
        offerId: "offer-1",
        offerUpdatedAt,
        evidence: { ...evidence, createdAt: new Date("2026-08-22T09:59:59.000Z") },
      }),
    ).toBe(false);
    expect(
      hasCurrentOwnerApproval({
        offerId: "offer-1",
        offerUpdatedAt,
        evidence: { ...evidence, metadata: { approvedOfferUpdatedAt: "2026-08-22T09:00:00.000Z" } },
      }),
    ).toBe(false);
    expect(
      hasCurrentOwnerApproval({
        offerId: "offer-1",
        offerUpdatedAt,
        evidence: { ...evidence, actor: { ...evidence.actor, role: AdminRole.ADMIN } },
      }),
    ).toBe(false);
  });

  it("considers an enabled offer public only inside its approved window", () => {
    expect(
      isOfferActiveNow(
        { enabled: true, startsAt: completeOffer.startsAt, endsAt: completeOffer.endsAt },
        new Date("2026-09-15T00:00:00.000Z"),
      ),
    ).toBe(true);
    expect(
      isOfferActiveNow(
        { enabled: true, startsAt: completeOffer.startsAt, endsAt: completeOffer.endsAt },
        new Date("2026-10-01T00:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
