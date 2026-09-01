import {
  GoogleSnapshotApprovalStatus,
  GoogleSyncStatus,
  Prisma,
} from "@prisma/client";
import { getPrisma } from "@/lib/db";
import { requestFingerprint } from "@/lib/enquiries/security";
import { googleBusinessAccessToken } from "@/lib/google-business/access";
import {
  getGoogleBusinessLocation,
  listGoogleBusinessAccounts,
  listGoogleBusinessLocations,
  listGoogleBusinessReviews,
} from "@/lib/google-business/client";
import { compareGoogleBusinessFields } from "@/lib/google-business/diff";
import type {
  GoogleBusinessLocation,
  GoogleReview as GoogleApiReview,
} from "@/lib/google-business/types";

const SNAPSHOT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const APPROVED_PHONE = "+918923092563";

export type GoogleApprovalField = "address" | "hours" | "reviewLinks";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function approvedGoogleUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const approvedHost =
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "g.page" ||
      host === "maps.app.goo.gl";
    return url.protocol === "https:" && approvedHost ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeAvatarUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString().slice(0, 1000) : null;
  } catch {
    return null;
  }
}

function starRating(value: string | undefined): number | null {
  return ({ ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as Record<string, number>)[
    value || ""
  ] ?? null;
}

function validDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function completeAddress(location: GoogleBusinessLocation) {
  const address = location.storefrontAddress;
  const lines = (address?.addressLines ?? []).map((line) => line.trim()).filter(Boolean);
  const result = {
    addressLine1: lines[0] || "",
    addressLine2: lines.slice(1).join(", ") || null,
    locality: address?.locality?.trim() || "",
    region: address?.administrativeArea?.trim() || "",
    postalCode: address?.postalCode?.trim() || "",
    countryCode: address?.regionCode?.trim().toUpperCase() || "",
  };
  return Object.values({
    addressLine1: result.addressLine1,
    locality: result.locality,
    region: result.region,
    postalCode: result.postalCode,
    countryCode: result.countryCode,
  }).every(Boolean)
    ? result
    : null;
}

function locationFromSnapshot(payload: Prisma.JsonValue): GoogleBusinessLocation {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("The staged Google snapshot is invalid.");
  }
  const location = payload as unknown as GoogleBusinessLocation;
  if (!/^locations\/[A-Za-z0-9_-]+$/.test(location.name || "")) {
    throw new Error("The staged Google location is invalid.");
  }
  return location;
}

export async function ensureBusinessProfile() {
  return getPrisma().businessProfile.upsert({
    where: { id: "primary" },
    create: {
      id: "primary",
      organizationName: "Audiosen",
      phone: APPROVED_PHONE,
      whatsapp: APPROVED_PHONE,
      email: "support@audiosen.com",
      websiteUrl: "https://audiosen.com",
      countryCode: "IN",
      isPublished: false,
    },
    update: {},
  });
}

export async function discoverGoogleAccounts(connectionId: string) {
  const token = await googleBusinessAccessToken(connectionId);
  return listGoogleBusinessAccounts(token);
}

export async function discoverGoogleLocations(connectionId: string, accountName: string) {
  const token = await googleBusinessAccessToken(connectionId);
  return listGoogleBusinessLocations(token, accountName);
}

export async function selectGoogleAccount(
  adminId: string,
  connectionId: string,
  accountName: string,
) {
  const accounts = await discoverGoogleAccounts(connectionId);
  if (!accounts.some((account) => account.name === accountName)) {
    throw new Error("Select an account returned by Google.");
  }
  await getPrisma().$transaction([
    getPrisma().googleConnection.update({
      where: { id: connectionId },
      data: { accountId: accountName, locationId: null },
    }),
    getPrisma().auditLog.create({
      data: {
        actorId: adminId,
        action: "google_business.account_selected",
        entityType: "GoogleConnection",
        entityId: connectionId,
        metadata: { accountName },
      },
    }),
  ]);
}

export async function selectGoogleLocation(
  adminId: string,
  connectionId: string,
  locationName: string,
) {
  const connection = await getPrisma().googleConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });
  if (!connection.accountId) throw new Error("Select a Google Business account first.");
  const locations = await discoverGoogleLocations(connectionId, connection.accountId);
  if (!locations.some((location) => location.name === locationName)) {
    throw new Error("Select a location returned by Google.");
  }
  await getPrisma().$transaction([
    getPrisma().googleConnection.update({
      where: { id: connectionId },
      data: { locationId: locationName },
    }),
    getPrisma().auditLog.create({
      data: {
        actorId: adminId,
        action: "google_business.location_selected",
        entityType: "GoogleConnection",
        entityId: connectionId,
        metadata: { locationName },
      },
    }),
  ]);
}

function validReview(review: GoogleApiReview) {
  const rating = starRating(review.starRating);
  const createdAt = validDate(review.createTime);
  const updatedAt = validDate(review.updateTime || review.createTime);
  if (!review.name || !rating || !createdAt || !updatedAt) return null;
  return {
    name: review.name.slice(0, 500),
    displayName: (review.reviewer?.displayName || "Google reviewer").trim().slice(0, 180),
    avatarUrl: safeAvatarUrl(review.reviewer?.profilePhotoUrl),
    rating,
    comment: review.comment?.trim() || null,
    createdAt,
    updatedAt,
    hash: requestFingerprint(review),
  };
}

export async function stageGoogleBusinessSnapshot(adminId: string, connectionId: string) {
  const prisma = getPrisma();
  const connection = await prisma.googleConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });
  if (!connection.accountId || !connection.locationId) {
    throw new Error("Select the exact Google account and location before syncing.");
  }

  const syncRun = await prisma.syncRun.create({
    data: {
      connectionId,
      requestedById: adminId,
      status: GoogleSyncStatus.RUNNING,
      startedAt: new Date(),
      fieldsRead: ["phone", "address", "regularHours", "metadata", "reviews"],
    },
  });

  try {
    const accessToken = await googleBusinessAccessToken(connectionId);
    const location = await getGoogleBusinessLocation(accessToken, connection.locationId);
    if (location.name !== connection.locationId) {
      throw new Error("Google returned a different location than the selected profile.");
    }
    const profile = await ensureBusinessProfile();
    const fieldDiffs = compareGoogleBusinessFields(profile, location);
    let apiReviews: GoogleApiReview[] = [];
    let reviewReadStatus: "available" | "unavailable" = "available";
    try {
      const response = await listGoogleBusinessReviews(
        accessToken,
        connection.accountId,
        connection.locationId,
      );
      apiReviews = response.reviews ?? [];
    } catch {
      reviewReadStatus = "unavailable";
    }

    const capturedAt = new Date();
    const expiresAt = new Date(capturedAt.getTime() + SNAPSHOT_TTL_MS);
    const differences = { fields: fieldDiffs, reviewReadStatus };
    const snapshot = await prisma.googleSnapshot.create({
      data: {
        connectionId,
        syncRunId: syncRun.id,
        payload: asJson(location),
        differences: asJson(differences),
        capturedAt,
        expiresAt,
      },
    });

    for (const sourceReview of apiReviews) {
      const review = validReview(sourceReview);
      if (!review) continue;
      await prisma.googleReview.upsert({
        where: { googleReviewName: review.name },
        create: {
          googleReviewName: review.name,
          sourceSnapshotId: snapshot.id,
          reviewerDisplayName: review.displayName,
          reviewerAvatarUrl: review.avatarUrl,
          starRating: review.rating,
          comment: review.comment,
          googleCreatedAt: review.createdAt,
          googleUpdatedAt: review.updatedAt,
          sourcePayloadHash: review.hash,
          fetchedAt: capturedAt,
          expiresAt,
        },
        update: {
          sourceSnapshotId: snapshot.id,
          reviewerDisplayName: review.displayName,
          reviewerAvatarUrl: review.avatarUrl,
          starRating: review.rating,
          comment: review.comment,
          googleCreatedAt: review.createdAt,
          googleUpdatedAt: review.updatedAt,
          sourcePayloadHash: review.hash,
          fetchedAt: capturedAt,
          expiresAt,
        },
      });
    }

    await prisma.$transaction([
      prisma.syncRun.update({
        where: { id: syncRun.id },
        data: {
          status: GoogleSyncStatus.SUCCEEDED,
          differences: asJson(differences),
          completedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "google_business.snapshot_staged",
          entityType: "GoogleSnapshot",
          entityId: snapshot.id,
          metadata: {
            fieldsRead: syncRun.fieldsRead,
            reviewCount: apiReviews.length,
            reviewReadStatus,
          },
        },
      }),
    ]);
    return snapshot;
  } catch (error) {
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: GoogleSyncStatus.FAILED,
        errorCode: "GOOGLE_READ_FAILED",
        errorMessage: "Google Business data could not be read.",
        completedAt: new Date(),
      },
    });
    throw error;
  }
}

export async function approveGoogleBusinessSnapshot(
  adminId: string,
  snapshotId: string,
  fields: GoogleApprovalField[],
) {
  const selected = new Set(fields);
  if (!selected.size) throw new Error("Select at least one field to approve.");
  const snapshot = await getPrisma().googleSnapshot.findUniqueOrThrow({
    where: { id: snapshotId },
    include: { connection: true },
  });
  if (
    snapshot.approvalStatus !== GoogleSnapshotApprovalStatus.STAGED ||
    snapshot.expiresAt <= new Date()
  ) {
    throw new Error("Only a current staged snapshot can be approved.");
  }

  const location = locationFromSnapshot(snapshot.payload);
  const address = completeAddress(location);
  const hours = location.regularHours?.periods ?? [];
  const mapsUri = approvedGoogleUrl(location.metadata?.mapsUri);
  const reviewUri = approvedGoogleUrl(location.metadata?.newReviewUri);
  if (selected.has("address") && !address) throw new Error("Google address is incomplete.");
  if (selected.has("hours") && hours.length === 0) throw new Error("Google hours are blank.");
  if (selected.has("reviewLinks") && !reviewUri) {
    throw new Error("Google did not return a verified review URI.");
  }

  const now = new Date();
  const profileUpdate: Prisma.BusinessProfileUpdateInput = {
    organizationName: "Audiosen",
    phone: APPROVED_PHONE,
    whatsapp: APPROVED_PHONE,
    email: "support@audiosen.com",
    websiteUrl: "https://audiosen.com",
    googleAccountId: snapshot.connection.accountId,
    googleLocationId: snapshot.connection.locationId,
    googlePlaceId: location.metadata?.placeId?.slice(0, 180) || null,
    lastGoogleVerifiedAt: now,
    approvedAt: now,
    approvedBy: { connect: { id: adminId } },
    sourceSnapshot: { connect: { id: snapshot.id } },
    isPublished: true,
    version: { increment: 1 },
    ...(selected.has("address") && address
      ? {
          ...address,
          googleMapsUri: mapsUri,
        }
      : {}),
    ...(selected.has("hours")
      ? {
          openingHours: asJson(hours),
          specialHours: location.specialHours?.specialHourPeriods
            ? asJson(location.specialHours.specialHourPeriods)
            : Prisma.DbNull,
        }
      : {}),
    ...(selected.has("reviewLinks") ? { googleReviewUri: reviewUri } : {}),
  };

  await getPrisma().$transaction(async (transaction) => {
    await transaction.googleSnapshot.updateMany({
      where: {
        id: { not: snapshot.id },
        approvalStatus: GoogleSnapshotApprovalStatus.APPROVED,
      },
      data: { approvalStatus: GoogleSnapshotApprovalStatus.SUPERSEDED },
    });
    await transaction.googleSnapshot.update({
      where: { id: snapshot.id },
      data: {
        approvalStatus: GoogleSnapshotApprovalStatus.APPROVED,
        approvedAt: now,
        approvedById: adminId,
      },
    });
    await transaction.businessProfile.upsert({
      where: { id: "primary" },
      create: {
        id: "primary",
        organizationName: "Audiosen",
        phone: APPROVED_PHONE,
        whatsapp: APPROVED_PHONE,
        email: "support@audiosen.com",
        websiteUrl: "https://audiosen.com",
        countryCode: "IN",
        approvedAt: now,
        approvedById: adminId,
        sourceSnapshotId: snapshot.id,
        lastGoogleVerifiedAt: now,
        isPublished: true,
        ...(selected.has("address") && address
          ? { ...address, googleMapsUri: mapsUri }
          : {}),
        ...(selected.has("hours") ? { openingHours: asJson(hours) } : {}),
        ...(selected.has("reviewLinks") ? { googleReviewUri: reviewUri } : {}),
      },
      update: profileUpdate,
    });
    await transaction.auditLog.create({
      data: {
        actorId: adminId,
        action: "google_business.snapshot_approved",
        entityType: "GoogleSnapshot",
        entityId: snapshot.id,
        metadata: { approvedFields: [...selected] },
      },
    });
  });
}

export async function rejectGoogleBusinessSnapshot(adminId: string, snapshotId: string) {
  await getPrisma().$transaction(async (transaction) => {
    const snapshot = await transaction.googleSnapshot.findUniqueOrThrow({
      where: { id: snapshotId },
    });
    if (snapshot.approvalStatus !== GoogleSnapshotApprovalStatus.STAGED) {
      throw new Error("Only a staged snapshot can be rejected.");
    }
    await transaction.googleSnapshot.update({
      where: { id: snapshotId },
      data: { approvalStatus: GoogleSnapshotApprovalStatus.REJECTED },
    });
    await transaction.auditLog.create({
      data: {
        actorId: adminId,
        action: "google_business.snapshot_rejected",
        entityType: "GoogleSnapshot",
        entityId: snapshotId,
      },
    });
  });
}

export async function setGoogleReviewSelection(
  adminId: string,
  reviewId: string,
  selected: boolean,
) {
  await getPrisma().$transaction(async (transaction) => {
    const review = await transaction.googleReview.findUniqueOrThrow({
      where: { id: reviewId },
      include: { sourceSnapshot: true },
    });
    if (
      selected &&
      (review.expiresAt <= new Date() ||
        review.sourceSnapshot?.approvalStatus !== GoogleSnapshotApprovalStatus.APPROVED)
    ) {
      throw new Error("Only a current review from an approved snapshot can be selected.");
    }
    await transaction.googleReview.update({
      where: { id: reviewId },
      data: {
        selectedByAdmin: selected,
        selectedAt: selected ? new Date() : null,
        selectedById: selected ? adminId : null,
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId: adminId,
        action: selected
          ? "google_business.review_selected"
          : "google_business.review_unselected",
        entityType: "GoogleReview",
        entityId: reviewId,
        metadata: { sourcePayloadHash: review.sourcePayloadHash },
      },
    });
  });
}
