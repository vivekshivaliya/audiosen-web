import { createHash } from "node:crypto";
import { AdminRole } from "@prisma/client";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import {
  CATALOG_MEDIA_MAX_FILE_BYTES,
  CATALOG_MEDIA_MAX_INPUT_DIMENSION,
  CatalogMediaIntakeError,
  intakeCatalogProductMedia,
  processCatalogMediaImage,
  type CatalogMediaObjectStore,
} from "@/lib/admin/catalog-media-intake";

async function imageFile(
  format: "jpeg" | "png" | "webp",
  width = 64,
  height = 64,
): Promise<File> {
  const pipeline = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 40, g: 100, b: 180, alpha: 0.8 },
    },
  });
  const bytes = format === "jpeg"
    ? await pipeline.flatten().jpeg().toBuffer()
    : format === "png"
      ? await pipeline.png().toBuffer()
      : await pipeline.webp().toBuffer();
  return new File([bytes], `product.${format === "jpeg" ? "jpg" : format}`, {
    type: `image/${format}`,
  });
}

describe("catalog product-media processing", () => {
  it("rotates, bounds, strips metadata, encodes WebP, and hashes transformed bytes", async () => {
    const jpeg = await sharp({
      create: {
        width: 3_000,
        height: 1_500,
        channels: 3,
        background: { r: 20, g: 80, b: 140 },
      },
    })
      .withMetadata({ orientation: 6 })
      .jpeg({ quality: 90 })
      .toBuffer();
    const result = await processCatalogMediaImage(
      new File([jpeg], "oriented.jpg", { type: "image/jpeg" }),
    );
    const outputMetadata = await sharp(result.bytes).metadata();

    expect(result.contentType).toBe("image/webp");
    expect(Math.max(result.width, result.height)).toBe(2_400);
    expect(outputMetadata.format).toBe("webp");
    expect(outputMetadata.orientation).toBeUndefined();
    expect(outputMetadata.exif).toBeUndefined();
    expect(outputMetadata.icc).toBeUndefined();
    expect(outputMetadata.xmp).toBeUndefined();
    expect(result.sha256).toBe(
      createHash("sha256").update(result.bytes).digest("hex"),
    );
  });

  it("rejects a declared MIME type that does not match the magic bytes", async () => {
    const jpeg = await imageFile("jpeg");
    const mismatched = new File([await jpeg.arrayBuffer()], "product.png", {
      type: "image/png",
    });

    await expect(processCatalogMediaImage(mismatched)).rejects.toMatchObject({
      code: "UNSUPPORTED_MEDIA",
    } satisfies Partial<CatalogMediaIntakeError>);
  });

  it("rejects a file above the byte cap before attempting decode", async () => {
    const oversized = new File(
      [new Uint8Array(CATALOG_MEDIA_MAX_FILE_BYTES + 1)],
      "oversized.jpg",
      { type: "image/jpeg" },
    );

    await expect(processCatalogMediaImage(oversized)).rejects.toMatchObject({
      code: "FILE_TOO_LARGE",
    } satisfies Partial<CatalogMediaIntakeError>);
  });

  it("rejects dimensions above the decode policy even when the compressed file is small", async () => {
    const oversized = await imageFile("png", CATALOG_MEDIA_MAX_INPUT_DIMENSION + 1, 1);

    await expect(processCatalogMediaImage(oversized)).rejects.toMatchObject({
      code: "INVALID_DIMENSIONS",
    } satisfies Partial<CatalogMediaIntakeError>);
  });

  it("rejects a non-Owner before any Blob write", async () => {
    const upload = vi.fn<CatalogMediaObjectStore["upload"]>(async () => undefined);

    await expect(
      intakeCatalogProductMedia(
        {
          actor: {
            id: "123e4567-e89b-42d3-a456-426614174001",
            email: "admin@audiosen.com",
            role: AdminRole.ADMIN,
          },
          productId: "123e4567-e89b-42d3-a456-426614174002",
          file: await imageFile("png"),
          altText: "Blue receiver-in-canal hearing aid",
          sourceUrl: "https://manufacturer.example/assets/model-image",
        },
        {
          objectStore: { upload, delete: async () => undefined },
        },
      ),
    ).rejects.toMatchObject({ code: "OWNER_REQUIRED" });
    expect(upload).not.toHaveBeenCalled();
  });

  it("deletes the random Blob when serializable database persistence fails", async () => {
    const upload = vi.fn<CatalogMediaObjectStore["upload"]>(async () => undefined);
    const remove = vi.fn<CatalogMediaObjectStore["delete"]>(async () => undefined);
    const persist = vi.fn(async () => {
      throw new Error("transaction_failed");
    });
    const storageKey = "catalog/2026/08/123e4567-e89b-42d3-a456-426614174000.webp";

    await expect(
      intakeCatalogProductMedia(
        {
          actor: {
            id: "123e4567-e89b-42d3-a456-426614174001",
            email: "owner@audiosen.com",
            role: AdminRole.OWNER,
          },
          productId: "123e4567-e89b-42d3-a456-426614174002",
          file: await imageFile("png"),
          altText: "Blue receiver-in-canal hearing aid",
          sourceUrl: "https://manufacturer.example/assets/model-image",
        },
        {
          objectStore: { upload, delete: remove },
          persist,
          randomId: () => "123e4567-e89b-42d3-a456-426614174000",
          now: () => new Date("2026-08-22T00:00:00.000Z"),
        },
      ),
    ).rejects.toThrow("transaction_failed");

    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0][0]).toBe(storageKey);
    expect(upload.mock.calls[0][1]).toMatchObject({ contentType: "image/webp" });
    expect(upload.mock.calls[0][1].sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(persist).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey,
        contentType: "image/webp",
        sourceUrl: "https://manufacturer.example/assets/model-image",
        sha256: upload.mock.calls[0][1].sha256,
      }),
    );
    expect(remove).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith(storageKey);
  });
});
