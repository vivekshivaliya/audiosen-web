import { AdminRole, MediaRightsStatus, ProductStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPrismaMock } = vi.hoisted(() => ({ getPrismaMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ getPrisma: getPrismaMock }));

import { createUnverifiedProductMedia } from "@/lib/admin/catalog-management";

describe("catalog media persistence transaction", () => {
  beforeEach(() => {
    getPrismaMock.mockReset();
  });

  it("rechecks the active Owner and creates only unverified, non-primary media", async () => {
    const createdMedia = {
      id: "123e4567-e89b-42d3-a456-426614174003",
      hearingAidId: "123e4567-e89b-42d3-a456-426614174002",
      storageKey: "catalog/2026/08/123e4567-e89b-42d3-a456-426614174000.webp",
    };
    const transaction = {
      adminUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: "123e4567-e89b-42d3-a456-426614174001",
          email: "owner@audiosen.com",
          role: AdminRole.OWNER,
          active: true,
        }),
      },
      hearingAid: {
        findUnique: vi.fn()
          .mockResolvedValueOnce({ id: createdMedia.hearingAidId })
          .mockResolvedValueOnce({
            id: createdMedia.hearingAidId,
            brandId: "123e4567-e89b-42d3-a456-426614174004",
            status: ProductStatus.DRAFT,
            sourceUrl: null,
            verifiedAt: null,
            verifiedBy: null,
            media: [
              {
                ...createdMedia,
                altText: "Blue receiver-in-canal hearing aid",
                contentType: "image/webp",
                width: 64,
                height: 64,
                isPrimary: false,
                sourceUrl: "https://manufacturer.example/assets/model-image",
                rightsStatus: MediaRightsStatus.UNVERIFIED,
                rightsEvidenceUrl: null,
                rightsCheckedAt: null,
                rightsApprovedAt: null,
                rightsApprovedBy: null,
              },
            ],
          }),
        update: vi.fn(),
      },
      productMedia: {
        create: vi.fn().mockResolvedValue(createdMedia),
      },
      brand: {
        findUnique: vi.fn().mockResolvedValue({
          id: "123e4567-e89b-42d3-a456-426614174004",
          isPublished: false,
          sourceUrl: null,
          verifiedAt: null,
          verifiedBy: null,
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };
    const runTransaction = vi.fn(
      async (
        operation: (client: typeof transaction) => Promise<unknown>,
        options: unknown,
      ) => {
        void options;
        return operation(transaction);
      },
    );
    getPrismaMock.mockReturnValue({ $transaction: runTransaction });

    await createUnverifiedProductMedia({
      actor: {
        id: "123e4567-e89b-42d3-a456-426614174001",
        email: "owner@audiosen.com",
        role: AdminRole.OWNER,
      },
      productId: createdMedia.hearingAidId,
      storageKey: createdMedia.storageKey,
      altText: "Blue receiver-in-canal hearing aid",
      contentType: "image/webp",
      width: 64,
      height: 64,
      sourceUrl: "https://manufacturer.example/assets/model-image",
      sha256: "a".repeat(64),
    });

    expect(runTransaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable" }),
    );
    expect(transaction.adminUser.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "123e4567-e89b-42d3-a456-426614174001" },
      }),
    );
    expect(transaction.productMedia.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        hearingAidId: createdMedia.hearingAidId,
        rightsStatus: MediaRightsStatus.UNVERIFIED,
        rightsCheckedAt: null,
        rightsApprovedAt: null,
        rightsApprovedBy: null,
        isPrimary: false,
      }),
    });
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "catalog.media_uploaded_unverified",
        metadata: expect.objectContaining({
          sha256: "a".repeat(64),
          rightsStatus: MediaRightsStatus.UNVERIFIED,
          isPrimary: false,
        }),
      }),
    });
    expect(transaction.hearingAid.update).not.toHaveBeenCalled();
  });
});
