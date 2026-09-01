import { GoogleSnapshotApprovalStatus } from "@prisma/client";
import { cache } from "react";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";

export type PublicGoogleReview = Readonly<{
  id: string;
  reviewerDisplayName: string;
  starRating: number;
  comment: string | null;
  googleCreatedAt: Date;
}>;

/**
 * Public review repository. Every publication condition is enforced in the
 * database query so callers cannot accidentally render staged or stale data.
 * React cache deduplicates the read within a render; /review owns its ISR TTL
 * and the existing admin workflow invalidates that route after moderation.
 */
export const getPublicGoogleReviews = cache(
  async (): Promise<readonly PublicGoogleReview[]> => {
    if (!isDatabaseConfigured()) return [];

    const now = new Date();

    try {
      return await getPrisma().googleReview.findMany({
        where: {
          selectedByAdmin: true,
          expiresAt: { gt: now },
          starRating: { gte: 1, lte: 5 },
          sourceSnapshot: {
            is: {
              approvalStatus: GoogleSnapshotApprovalStatus.APPROVED,
              expiresAt: { gt: now },
              appliedProfile: {
                is: {
                  id: "primary",
                  isPublished: true,
                },
              },
            },
          },
        },
        orderBy: [{ googleUpdatedAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          reviewerDisplayName: true,
          starRating: true,
          comment: true,
          googleCreatedAt: true,
        },
      });
    } catch {
      return [];
    }
  },
);
