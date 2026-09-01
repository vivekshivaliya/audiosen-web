import { AdminRole, ProductStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPrismaMock } = vi.hoisted(() => ({ getPrismaMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ getPrisma: getPrismaMock }));

import {
  CatalogManagementError,
  createCatalogProductDraft,
  setProductPublication,
  updateCatalogProductDraft,
} from "@/lib/admin/catalog-management";

const owner = {
  id: "123e4567-e89b-42d3-a456-426614174001",
  email: "owner@audiosen.com",
  role: AdminRole.OWNER,
} as const;
const brandId = "123e4567-e89b-42d3-a456-426614174002";
const productId = "123e4567-e89b-42d3-a456-426614174003";

describe("catalog draft persistence", () => {
  beforeEach(() => {
    getPrismaMock.mockReset();
  });

  it("creates a model only as an audited, unknown-feature draft", async () => {
    const transaction = {
      adminUser: {
        findUnique: vi.fn().mockResolvedValue({ ...owner, active: true }),
      },
      brand: {
        findUnique: vi.fn().mockResolvedValue({ id: brandId }),
      },
      hearingAid: {
        create: vi.fn().mockResolvedValue({
          id: productId,
          brandId,
          slug: "source-model",
          status: ProductStatus.DRAFT,
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };
    const runTransaction = vi.fn(
      async (operation: (client: typeof transaction) => Promise<unknown>, options: unknown) => {
        void options;
        return operation(transaction);
      },
    );
    getPrismaMock.mockReturnValue({ $transaction: runTransaction });

    await createCatalogProductDraft({
      actor: owner,
      brandId,
      slug: "source-model",
      modelName: "Source Model",
      style: "ric",
      sortOrder: "4",
    });

    expect(runTransaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable" }),
    );
    expect(transaction.adminUser.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: owner.id } }),
    );
    expect(transaction.hearingAid.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        brandId,
        slug: "source-model",
        status: ProductStatus.DRAFT,
        isFeatured: false,
        consultationRequired: true,
        features: expect.objectContaining({
          rechargeable: "unknown",
          bluetoothStreaming: "unknown",
          customFit: "unknown",
        }),
      }),
    });
    expect(transaction.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "catalog.product_draft_created",
        entityType: "HearingAid",
        entityId: productId,
      }),
    });
  });

  it("revokes approval, drafts an edited published model, and rechecks its brand", async () => {
    const hearingAid = {
      findUnique: vi.fn().mockResolvedValue({
        id: productId,
        brandId,
        status: ProductStatus.PUBLISHED,
        verifiedAt: new Date("2026-08-01T00:00:00.000Z"),
        verifiedBy: owner.email,
      }),
      update: vi.fn().mockResolvedValue({ id: productId, status: ProductStatus.DRAFT }),
      findMany: vi.fn().mockResolvedValue([]),
    };
    const transaction = {
      adminUser: {
        findUnique: vi.fn().mockResolvedValue({ ...owner, active: true }),
      },
      hearingAid,
      brand: {
        findUnique: vi.fn().mockResolvedValue({
          id: brandId,
          isPublished: true,
          sourceUrl: "https://manufacturer.example/brand",
          verifiedAt: new Date("2026-08-01T00:00:00.000Z"),
          verifiedBy: owner.email,
        }),
        update: vi.fn().mockResolvedValue({ id: brandId, isPublished: false }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: "audit-id" }),
      },
    };
    const runTransaction = vi.fn(
      async (operation: (client: typeof transaction) => Promise<unknown>, options: unknown) => {
        void options;
        return operation(transaction);
      },
    );
    getPrismaMock.mockReturnValue({ $transaction: runTransaction });

    await updateCatalogProductDraft({
      actor: owner,
      productId,
      modelName: "Source Model Updated",
      style: "ric",
      summary: "Assessment-led model guidance.",
      suitableUse: "Source-confirmed fitting contexts.",
      rechargeable: "yes",
      bluetooth: "unknown",
      streaming: "no",
      mobileApp: "",
      hearingLossSuitability: "",
      noiseManagement: "",
      warranty: "Manufacturer terms apply.",
      fittingInformation: "Requires a clinical fitting.",
      afterCare: "Follow-up plan is discussed during consultation.",
      repairSupport: "Assessment is required before repair advice.",
      consultationRequired: true,
      priceNote: "Assessment and fitting determine the quote.",
      isFeatured: true,
      sortOrder: "2",
      features: { rechargeable: "yes", bluetoothStreaming: "unknown" },
      specificationsJson: '{"ipRating":"IP68"}',
    });

    expect(hearingAid.update).toHaveBeenCalledWith({
      where: { id: productId },
      data: expect.objectContaining({
        status: ProductStatus.DRAFT,
        verifiedAt: null,
        verifiedBy: null,
        specifications: { ipRating: "IP68" },
        features: expect.objectContaining({
          rechargeable: "yes",
          bluetoothStreaming: "unknown",
          auracast: "unknown",
        }),
      }),
    });
    const updateData = hearingAid.update.mock.calls[0][0].data;
    expect(updateData).not.toHaveProperty("slug");
    expect(updateData).not.toHaveProperty("sourceUrl");
    expect(transaction.brand.update).toHaveBeenCalledWith({
      where: { id: brandId },
      data: { isPublished: false },
    });
    expect(transaction.auditLog.create).toHaveBeenCalledTimes(2);
    expect(transaction.auditLog.create.mock.calls.map(([call]) => call.data.action)).toEqual([
      "catalog.product_details_updated",
      "catalog.brand_auto_unpublished",
    ]);
  });

  it("fails before a catalog write when the transaction-time account is no longer active", async () => {
    const transaction = {
      adminUser: {
        findUnique: vi.fn().mockResolvedValue({ ...owner, active: false }),
      },
      brand: { findUnique: vi.fn() },
      hearingAid: { create: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    getPrismaMock.mockReturnValue({
      $transaction: vi.fn(
        async (operation: (client: typeof transaction) => Promise<unknown>) => operation(transaction),
      ),
    });

    await expect(
      createCatalogProductDraft({
        actor: owner,
        brandId,
        slug: "source-model",
        modelName: "Source Model",
        style: "ric",
        sortOrder: "0",
      }),
    ).rejects.toEqual(new CatalogManagementError("OWNER_REQUIRED"));
    expect(transaction.hearingAid.create).not.toHaveBeenCalled();
    expect(transaction.auditLog.create).not.toHaveBeenCalled();
  });

  it("rejects an Admin actor before opening a draft transaction", async () => {
    await expect(
      createCatalogProductDraft({
        actor: { ...owner, role: AdminRole.ADMIN },
        brandId,
        slug: "source-model",
        modelName: "Source Model",
        style: "ric",
        sortOrder: "0",
      }),
    ).rejects.toEqual(new CatalogManagementError("OWNER_REQUIRED"));
    expect(getPrismaMock).not.toHaveBeenCalled();
  });

  it("blocks publication when a legacy draft contains a current-availability claim", async () => {
    const transaction = {
      adminUser: {
        findUnique: vi.fn().mockResolvedValue({ ...owner, active: true }),
      },
      hearingAid: {
        findUnique: vi.fn().mockResolvedValue({
          id: productId,
          brandId,
          status: ProductStatus.DRAFT,
          sourceUrl: "https://manufacturer.example/model",
          verifiedAt: new Date("2026-08-01T00:00:00.000Z"),
          verifiedBy: owner.email,
          summary: "Available now for same-day dispatch.",
          suitableUse: null,
          mobileApp: null,
          hearingLossSuitability: null,
          noiseManagement: null,
          warranty: null,
          fittingInformation: null,
          afterCare: null,
          repairSupport: null,
          priceNote: null,
          features: null,
          specifications: null,
          media: [],
        }),
        update: vi.fn(),
      },
      auditLog: { create: vi.fn() },
    };
    getPrismaMock.mockReturnValue({
      $transaction: vi.fn(
        async (operation: (client: typeof transaction) => Promise<unknown>) => operation(transaction),
      ),
    });

    await expect(
      setProductPublication({ actor: owner, productId, publish: true }),
    ).rejects.toEqual(new CatalogManagementError("INVENTORY_CLAIM"));
    expect(transaction.hearingAid.update).not.toHaveBeenCalled();
    expect(transaction.auditLog.create).not.toHaveBeenCalled();
  });
});
