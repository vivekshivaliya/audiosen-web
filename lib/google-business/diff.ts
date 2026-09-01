import type { GoogleBusinessLocation, GooglePostalAddress } from "@/lib/google-business/types";

export type WebsiteBusinessFields = {
  phone: string;
  addressLine1: string | null;
  addressLine2: string | null;
  locality: string | null;
  region: string | null;
  postalCode: string | null;
  countryCode: string;
  openingHours: unknown;
};

export type GoogleBusinessFieldDiff = {
  field: "phone" | "address" | "hours";
  websiteValue: unknown;
  googleValue: unknown;
  state: "same" | "different" | "google_blank" | "website_blank";
  canApprove: boolean;
};

function normalizePhone(value: string | undefined | null, countryCode: string) {
  const digits = value?.replace(/\D/g, "") || "";
  if (countryCode.toUpperCase() === "IN") {
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  }
  return digits;
}

function addressFromGoogle(address: GooglePostalAddress | undefined) {
  const lines = (address?.addressLines ?? []).map((line) => line.trim()).filter(Boolean);
  const result = {
    addressLine1: lines[0] || "",
    addressLine2: lines.slice(1).join(", ") || null,
    locality: address?.locality?.trim() || "",
    region: address?.administrativeArea?.trim() || "",
    postalCode: address?.postalCode?.trim() || "",
    countryCode: address?.regionCode?.trim().toUpperCase() || "",
  };
  const complete = Boolean(
    result.addressLine1 &&
      result.locality &&
      result.region &&
      result.postalCode &&
      result.countryCode,
  );
  return { value: result, complete };
}

function stableJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, stableJson(child)]),
    );
  }
  return value;
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(stableJson(left)) === JSON.stringify(stableJson(right));
}

export function compareGoogleBusinessFields(
  website: WebsiteBusinessFields,
  google: GoogleBusinessLocation,
): GoogleBusinessFieldDiff[] {
  const googlePhone = google.phoneNumbers?.primaryPhone?.trim() || "";
  const websiteAddress = {
    addressLine1: website.addressLine1 || "",
    addressLine2: website.addressLine2 || null,
    locality: website.locality || "",
    region: website.region || "",
    postalCode: website.postalCode || "",
    countryCode: website.countryCode || "",
  };
  const googleAddress = addressFromGoogle(google.storefrontAddress);
  const googleHours = google.regularHours?.periods ?? [];
  const websiteHours = website.openingHours ?? [];

  return [
    {
      field: "phone",
      websiteValue: website.phone,
      googleValue: googlePhone,
      state: !googlePhone
        ? "google_blank"
        : !website.phone
          ? "website_blank"
          : normalizePhone(website.phone, website.countryCode) ===
              normalizePhone(googlePhone, website.countryCode)
            ? "same"
            : "different",
      canApprove: Boolean(googlePhone),
    },
    {
      field: "address",
      websiteValue: websiteAddress,
      googleValue: googleAddress.value,
      state: !googleAddress.complete
        ? "google_blank"
        : !website.addressLine1
          ? "website_blank"
          : same(websiteAddress, googleAddress.value)
            ? "same"
            : "different",
      canApprove: googleAddress.complete,
    },
    {
      field: "hours",
      websiteValue: websiteHours,
      googleValue: googleHours,
      state: googleHours.length === 0
        ? "google_blank"
        : !Array.isArray(websiteHours) || websiteHours.length === 0
          ? "website_blank"
          : same(websiteHours, googleHours)
            ? "same"
            : "different",
      canApprove: googleHours.length > 0,
    },
  ];
}
