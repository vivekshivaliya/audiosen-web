import { describe, expect, it } from "vitest";
import { compareGoogleBusinessFields, type WebsiteBusinessFields } from "@/lib/google-business/diff";
import type { GoogleBusinessLocation } from "@/lib/google-business/types";

const website: WebsiteBusinessFields = {
  phone: "+918923092563",
  addressLine1: null,
  addressLine2: null,
  locality: null,
  region: null,
  postalCode: null,
  countryCode: "IN",
  openingHours: null,
};

const completeGoogleLocation: GoogleBusinessLocation = {
  name: "locations/123",
  title: "Audiosen",
  phoneNumbers: { primaryPhone: "89230 92563" },
  storefrontAddress: {
    addressLines: ["Owner-approved street"],
    locality: "Dehradun",
    administrativeArea: "Uttarakhand",
    postalCode: "248001",
    regionCode: "IN",
  },
  regularHours: {
    periods: [
      {
        openDay: "MONDAY",
        openTime: { hours: 9 },
        closeDay: "MONDAY",
        closeTime: { hours: 17 },
      },
    ],
  },
};

describe("compareGoogleBusinessFields", () => {
  it("normalizes the approved phone and stages complete address and hours", () => {
    const differences = compareGoogleBusinessFields(website, completeGoogleLocation);
    expect(differences.find((entry) => entry.field === "phone")).toMatchObject({
      state: "same",
      canApprove: true,
    });
    expect(differences.find((entry) => entry.field === "address")).toMatchObject({
      state: "website_blank",
      canApprove: true,
    });
    expect(differences.find((entry) => entry.field === "hours")).toMatchObject({
      state: "website_blank",
      canApprove: true,
    });
  });

  it("refuses an incomplete Google address", () => {
    const differences = compareGoogleBusinessFields(website, {
      ...completeGoogleLocation,
      storefrontAddress: { addressLines: ["Partial only"], regionCode: "IN" },
    });
    expect(differences.find((entry) => entry.field === "address")).toMatchObject({
      state: "google_blank",
      canApprove: false,
    });
  });

  it("surfaces a phone mismatch instead of silently approving it", () => {
    const differences = compareGoogleBusinessFields(website, {
      ...completeGoogleLocation,
      phoneNumbers: { primaryPhone: "+91 11111 11111" },
    });
    expect(differences.find((entry) => entry.field === "phone")).toMatchObject({
      state: "different",
      canApprove: true,
    });
  });

  it("does not overwrite approved hours with blank Google data", () => {
    const differences = compareGoogleBusinessFields(
      { ...website, openingHours: completeGoogleLocation.regularHours?.periods },
      { ...completeGoogleLocation, regularHours: undefined },
    );
    expect(differences.find((entry) => entry.field === "hours")).toMatchObject({
      state: "google_blank",
      canApprove: false,
    });
  });
});
