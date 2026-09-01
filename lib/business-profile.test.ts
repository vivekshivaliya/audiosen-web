import { describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getPrisma: vi.fn(),
  isDatabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/db", () => dbMocks);

import {
  buildCanonicalOrganizationJsonLd,
  getCanonicalOrganizationJsonLd,
  toOpeningHoursSpecification,
  type ApprovedBusinessProfile,
} from "@/lib/business-profile";
import { organizationJsonLd } from "@/lib/content";

function approvedProfile(
  overrides: Partial<ApprovedBusinessProfile> = {},
): ApprovedBusinessProfile {
  return {
    organizationName: "Untrusted database name",
    phone: "+911111111111",
    email: "untrusted@example.com",
    googleMapsUri: null,
    googleReviewUri: null,
    address: {
      addressLine1: "Untrusted address",
      addressLine2: null,
      locality: "Elsewhere",
      region: "Elsewhere",
      postalCode: "000000",
      countryCode: "IN",
    },
    openingHours: null,
    approvedAt: new Date("2026-08-30T00:00:00.000Z"),
    ...overrides,
  };
}

describe("toOpeningHoursSpecification", () => {
  it("preserves split shifts, overnight periods, and calendar-day 24-hour periods", () => {
    expect(
      toOpeningHoursSpecification([
        {
          openDay: "MONDAY",
          openTime: { hours: 9 },
          closeDay: "MONDAY",
          closeTime: { hours: 12 },
        },
        {
          openDay: "MONDAY",
          openTime: { hours: 13, minutes: 30 },
          closeDay: "MONDAY",
          closeTime: { hours: 17 },
        },
        {
          openDay: "FRIDAY",
          openTime: { hours: 22 },
          closeDay: "SATURDAY",
          closeTime: { hours: 2 },
        },
        {
          openDay: "SUNDAY",
          openTime: {},
          closeDay: "MONDAY",
          closeTime: {},
        },
      ]),
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Monday",
        opens: "09:00",
        closes: "12:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Monday",
        opens: "13:30",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Friday",
        opens: "22:00",
        closes: "02:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Sunday",
        opens: "00:00",
        closes: "23:59",
      },
    ]);
  });

  it("normalizes Google's 24:00 end-of-day value without changing the day relationship", () => {
    expect(
      toOpeningHoursSpecification([
        {
          openDay: "TUESDAY",
          openTime: { hours: 9 },
          closeDay: "TUESDAY",
          closeTime: { hours: 24 },
        },
      ]),
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "https://schema.org/Tuesday",
        opens: "09:00",
        closes: "00:00",
      },
    ]);
  });

  it("rejects the entire schedule when any period is malformed or unrepresentable", () => {
    const validPeriod = {
      openDay: "MONDAY",
      openTime: { hours: 9 },
      closeDay: "MONDAY",
      closeTime: { hours: 17 },
    };

    expect(
      toOpeningHoursSpecification([
        validPeriod,
        { ...validPeriod, openDay: "DAY_OF_WEEK_UNSPECIFIED" },
      ]),
    ).toBeNull();
    expect(
      toOpeningHoursSpecification([
        {
          openDay: "MONDAY",
          openTime: { hours: 9 },
          closeDay: "TUESDAY",
          closeTime: { hours: 9 },
        },
      ]),
    ).toBeNull();
    expect(toOpeningHoursSpecification([])).toBeNull();
  });
});

describe("buildCanonicalOrganizationJsonLd", () => {
  it("uses the verified static identity when approved Google data is unavailable", () => {
    expect(buildCanonicalOrganizationJsonLd(null)).toEqual(organizationJsonLd);
  });

  it("enriches only Maps and valid hours while static NAP always wins", () => {
    const result = buildCanonicalOrganizationJsonLd(
      approvedProfile({
        googleMapsUri: "https://maps.app.goo.gl/approved-map",
        openingHours: [
          {
            openDay: "WEDNESDAY",
            openTime: { hours: 10 },
            closeDay: "WEDNESDAY",
            closeTime: { hours: 18 },
          },
        ],
      }),
    );

    expect(result).toMatchObject({
      "@id": "https://audiosen.com/#organization",
      "@type": "LocalBusiness",
      name: organizationJsonLd.name,
      telephone: organizationJsonLd.telephone,
      email: organizationJsonLd.email,
      address: organizationJsonLd.address,
      hasMap: "https://maps.app.goo.gl/approved-map",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: "https://schema.org/Wednesday",
          opens: "10:00",
          closes: "18:00",
        },
      ],
    });
  });

  it("falls back to the static map and omits all hours when approved enrichment is invalid", () => {
    const result = buildCanonicalOrganizationJsonLd(
      approvedProfile({
        googleMapsUri: "https://example.com/not-approved",
        openingHours: [
          {
            openDay: "WEDNESDAY",
            openTime: { hours: 10 },
            closeDay: "WEDNESDAY",
          },
        ],
      }),
    );

    expect(result.hasMap).toBe(organizationJsonLd.hasMap);
    expect(result).not.toHaveProperty("openingHoursSpecification");
  });

  it("keeps rendering static schema without hours when the database read fails", async () => {
    dbMocks.isDatabaseConfigured.mockReturnValue(true);
    dbMocks.getPrisma.mockReturnValue({
      businessProfile: {
        findUnique: vi.fn().mockRejectedValue(new Error("database unavailable")),
      },
    });

    await expect(getCanonicalOrganizationJsonLd()).resolves.toEqual(organizationJsonLd);
  });
});
