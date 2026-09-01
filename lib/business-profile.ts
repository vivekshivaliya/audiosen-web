import { cache } from "react";
import { organizationJsonLd } from "@/lib/content";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

const GOOGLE_DAY_INDEX: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

const SCHEMA_DAYS = [
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
  "https://schema.org/Sunday",
] as const;

export type OpeningHoursSpecification = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: (typeof SCHEMA_DAYS)[number];
  opens: string;
  closes: string;
};

export type ApprovedBusinessProfile = {
  organizationName: string;
  phone: string;
  email: string;
  googleMapsUri: string | null;
  googleReviewUri: string | null;
  address: {
    addressLine1: string;
    addressLine2: string | null;
    locality: string;
    region: string;
    postalCode: string;
    countryCode: string;
  } | null;
  openingHours: unknown;
  approvedAt: Date | null;
};

function approvedGoogleUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const isGoogleHost =
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "g.page" ||
      host === "maps.app.goo.gl";
    return url.protocol === "https:" && isGoogleHost ? url.toString() : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function integerOrDefault(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback;
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function googleTime(value: unknown): { dayCarry: 0 | 1; minutes: number } | null {
  if (!isRecord(value)) return null;

  // Google TimeOfDay uses optional scalar fields because zero values can be
  // omitted from its JSON representation. Missing fields therefore mean zero.
  const hours = integerOrDefault(value.hours, 0);
  const minutes = integerOrDefault(value.minutes, 0);
  const seconds = integerOrDefault(value.seconds, 0);
  const nanos = integerOrDefault(value.nanos, 0);
  if (
    hours === null ||
    minutes === null ||
    seconds === null ||
    nanos === null ||
    hours < 0 ||
    hours > 24 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds !== 0 ||
    nanos !== 0 ||
    (hours === 24 && minutes !== 0)
  ) {
    return null;
  }

  return hours === 24
    ? { dayCarry: 1, minutes: 0 }
    : { dayCarry: 0, minutes: hours * 60 + minutes };
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  return `${hours.toString().padStart(2, "0")}:${(minutes % 60)
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Converts the owner-approved Google regularHours periods stored in the
 * BusinessProfile cache into Schema.org opening-hours values. The conversion
 * is deliberately all-or-nothing so malformed data cannot publish a partial,
 * misleading weekly schedule.
 */
export function toOpeningHoursSpecification(
  value: unknown,
): OpeningHoursSpecification[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const converted: Array<{
    start: number;
    specification: OpeningHoursSpecification;
  }> = [];

  for (const period of value) {
    if (!isRecord(period)) return null;

    const openDay =
      typeof period.openDay === "string" ? GOOGLE_DAY_INDEX[period.openDay] : undefined;
    const closeDay =
      typeof period.closeDay === "string" ? GOOGLE_DAY_INDEX[period.closeDay] : undefined;
    const openTime = googleTime(period.openTime);
    const closeTime = googleTime(period.closeTime);
    if (openDay === undefined || closeDay === undefined || !openTime || !closeTime) {
      return null;
    }

    const start = (openDay + openTime.dayCarry) * MINUTES_PER_DAY + openTime.minutes;
    let end = (closeDay + closeTime.dayCarry) * MINUTES_PER_DAY + closeTime.minutes;
    while (end <= start) end += MINUTES_PER_WEEK;

    const duration = end - start;
    if (duration <= 0 || duration > MINUTES_PER_DAY) return null;

    const normalizedDay = Math.floor(start / MINUTES_PER_DAY) % SCHEMA_DAYS.length;
    const opensAt = start % MINUTES_PER_DAY;
    const closesAt = end % MINUTES_PER_DAY;

    if (duration === MINUTES_PER_DAY && (opensAt !== 0 || closesAt !== 0)) {
      return null;
    }

    converted.push({
      start: start % MINUTES_PER_WEEK,
      specification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAYS[normalizedDay],
        opens: formatTime(opensAt),
        closes:
          duration === MINUTES_PER_DAY ? "23:59" : formatTime(closesAt),
      },
    });
  }

  converted.sort((left, right) => left.start - right.start);
  return converted.map(({ specification }) => specification);
}

export function buildCanonicalOrganizationJsonLd(
  profile: ApprovedBusinessProfile | null,
): Record<string, unknown> {
  const approvedMap = approvedGoogleUrl(profile?.googleMapsUri ?? null);
  const openingHours = toOpeningHoursSpecification(profile?.openingHours);

  return {
    ...organizationJsonLd,
    hasMap: approvedMap ?? organizationJsonLd.hasMap,
    ...(openingHours ? { openingHoursSpecification: openingHours } : {}),
  };
}

export const getApprovedBusinessProfile = cache(
  async (): Promise<ApprovedBusinessProfile | null> => {
    if (!isDatabaseConfigured()) return null;

    try {
      const profile = await getPrisma().businessProfile.findUnique({
        where: { id: "primary" },
      });
      if (!profile?.isPublished) return null;

      const address =
        profile.addressLine1 &&
        profile.locality &&
        profile.region &&
        profile.postalCode
          ? {
              addressLine1: profile.addressLine1,
              addressLine2: profile.addressLine2,
              locality: profile.locality,
              region: profile.region,
              postalCode: profile.postalCode,
              countryCode: profile.countryCode,
            }
          : null;

      return {
        organizationName: profile.organizationName,
        phone: profile.phone,
        email: profile.email,
        googleMapsUri: approvedGoogleUrl(profile.googleMapsUri),
        googleReviewUri: approvedGoogleUrl(profile.googleReviewUri),
        address,
        openingHours: profile.openingHours,
        approvedAt: profile.lastGoogleVerifiedAt,
      };
    } catch {
      return null;
    }
  },
);

export async function getCanonicalOrganizationJsonLd(): Promise<Record<string, unknown>> {
  return buildCanonicalOrganizationJsonLd(await getApprovedBusinessProfile());
}
