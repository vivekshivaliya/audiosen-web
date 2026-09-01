import { createHash, randomUUID } from "node:crypto";
import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { AdminRole } from "@prisma/client";
import sharp from "sharp";
import { z } from "zod";
import {
  CatalogManagementError,
  createUnverifiedProductMedia,
  type CatalogAdminActor,
} from "@/lib/admin/catalog-management";
import { isConfirmedHttpsUrl } from "@/lib/admin/catalog-gates";
import { isDatabaseConfigured } from "@/lib/db";

export const CATALOG_MEDIA_MAX_FILE_BYTES = 8 * 1024 * 1024;
export const CATALOG_MEDIA_MAX_INPUT_PIXELS = 40_000_000;
export const CATALOG_MEDIA_MAX_INPUT_DIMENSION = 12_000;
export const CATALOG_MEDIA_MAX_OUTPUT_DIMENSION = 2_400;
export const CATALOG_MEDIA_MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

const allowedInputMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const productIdSchema = z.string().uuid();
const altTextSchema = z.string().trim().min(1).max(240);
const sourceUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine(isConfirmedHttpsUrl, "An exact HTTPS asset source URL is required.");

export type CatalogMediaIntakeCode =
  | "EMPTY_FILE"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MEDIA"
  | "INVALID_IMAGE"
  | "INVALID_DIMENSIONS"
  | "INVALID_INPUT";

export class CatalogMediaIntakeError extends Error {
  constructor(
    public readonly code: CatalogMediaIntakeCode,
    message: string,
  ) {
    super(message);
    this.name = "CatalogMediaIntakeError";
  }
}

export class CatalogMediaConfigurationError extends Error {
  constructor(message = "Public product-media storage is not configured safely.") {
    super(message);
    this.name = "CatalogMediaConfigurationError";
  }
}

export class CatalogMediaCleanupError extends Error {
  constructor() {
    super("The uploaded Blob could not be removed after metadata persistence failed.");
    this.name = "CatalogMediaCleanupError";
  }
}

export type ProcessedCatalogMedia = Readonly<{
  bytes: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  sha256: string;
  sourceContentType: "image/jpeg" | "image/png" | "image/webp";
}>;

export function detectCatalogImageMimeType(
  bytes: Uint8Array,
): ProcessedCatalogMedia["sourceContentType"] | undefined {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return undefined;
}

function invalidDimensions(width: number | undefined, height: number | undefined): boolean {
  if (!width || !height || width < 1 || height < 1) return true;
  if (width > CATALOG_MEDIA_MAX_INPUT_DIMENSION || height > CATALOG_MEDIA_MAX_INPUT_DIMENSION) {
    return true;
  }
  return width * height > CATALOG_MEDIA_MAX_INPUT_PIXELS;
}

export async function processCatalogMediaImage(file: File): Promise<ProcessedCatalogMedia> {
  if (file.size < 1) {
    throw new CatalogMediaIntakeError("EMPTY_FILE", "The selected image is empty.");
  }
  if (file.size > CATALOG_MEDIA_MAX_FILE_BYTES) {
    throw new CatalogMediaIntakeError("FILE_TOO_LARGE", "The selected image exceeds 8 MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const detected = detectCatalogImageMimeType(input);
  const declared = file.type.trim().toLowerCase();
  if (!detected || !allowedInputMimeTypes.has(declared) || declared !== detected) {
    throw new CatalogMediaIntakeError(
      "UNSUPPORTED_MEDIA",
      "The image content and declared MIME type must match JPEG, PNG, or WebP.",
    );
  }

  try {
    const image = sharp(input, {
      animated: false,
      failOn: "error",
      limitInputPixels: CATALOG_MEDIA_MAX_INPUT_PIXELS,
      sequentialRead: true,
    });
    const metadata = await image.metadata();
    const expectedFormat = detected.slice("image/".length);
    if (metadata.format !== expectedFormat || (metadata.pages ?? 1) !== 1) {
      throw new CatalogMediaIntakeError(
        "UNSUPPORTED_MEDIA",
        "Animated or mismatched image data is not accepted.",
      );
    }
    if (invalidDimensions(metadata.width, metadata.height)) {
      throw new CatalogMediaIntakeError(
        "INVALID_DIMENSIONS",
        "The image dimensions exceed the safe decode bounds.",
      );
    }

    const { data, info } = await image
      .rotate()
      .resize({
        width: CATALOG_MEDIA_MAX_OUTPUT_DIMENSION,
        height: CATALOG_MEDIA_MAX_OUTPUT_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toColourspace("srgb")
      .webp({ effort: 5, quality: 86, alphaQuality: 90, smartSubsample: true })
      .toBuffer({ resolveWithObject: true });

    if (
      info.format !== "webp" ||
      info.width < 1 ||
      info.height < 1 ||
      info.width > CATALOG_MEDIA_MAX_OUTPUT_DIMENSION ||
      info.height > CATALOG_MEDIA_MAX_OUTPUT_DIMENSION ||
      data.byteLength < 1 ||
      data.byteLength > CATALOG_MEDIA_MAX_OUTPUT_BYTES
    ) {
      throw new CatalogMediaIntakeError(
        "INVALID_IMAGE",
        "The optimized image output did not meet the catalog media bounds.",
      );
    }

    return {
      bytes: data,
      contentType: "image/webp",
      width: info.width,
      height: info.height,
      sha256: createHash("sha256").update(data).digest("hex"),
      sourceContentType: detected,
    };
  } catch (error) {
    if (error instanceof CatalogMediaIntakeError) throw error;
    throw new CatalogMediaIntakeError(
      "INVALID_IMAGE",
      "The image could not be decoded and normalized safely.",
    );
  }
}

function productMediaBlobConfiguration(): {
  serviceUrl: string;
  containerName: string;
} {
  const serviceUrl = process.env.AZURE_BLOB_SERVICE_URL?.trim();
  const containerName = process.env.AZURE_PRODUCT_MEDIA_CONTAINER?.trim();
  const publicBaseUrl = process.env.CATALOG_PUBLIC_MEDIA_BASE_URL?.trim();
  if (!serviceUrl || !containerName || !publicBaseUrl || !isDatabaseConfigured()) {
    throw new CatalogMediaConfigurationError();
  }
  if (containerName.toLowerCase() === process.env.AZURE_BLOB_CONTAINER?.trim().toLowerCase()) {
    throw new CatalogMediaConfigurationError(
      "Public product media and private patient uploads must use different containers.",
    );
  }
  if (!/^(?!.*--)[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(containerName)) {
    throw new CatalogMediaConfigurationError("AZURE_PRODUCT_MEDIA_CONTAINER is invalid.");
  }

  let storageUrl: URL;
  let deliveryUrl: URL;
  try {
    storageUrl = new URL(serviceUrl);
    deliveryUrl = new URL(publicBaseUrl);
  } catch {
    throw new CatalogMediaConfigurationError("Product-media storage URLs are invalid.");
  }
  if (
    storageUrl.username ||
    storageUrl.password ||
    storageUrl.search ||
    storageUrl.hash ||
    deliveryUrl.protocol !== "https:" ||
    deliveryUrl.username ||
    deliveryUrl.password ||
    deliveryUrl.search ||
    deliveryUrl.hash
  ) {
    throw new CatalogMediaConfigurationError(
      "Product-media storage must use credential-free service and HTTPS delivery URLs.",
    );
  }
  if (!new Set(["http:", "https:"]).has(storageUrl.protocol)) {
    throw new CatalogMediaConfigurationError("Azure Blob storage must use HTTP or HTTPS.");
  }
  if (process.env.NODE_ENV === "production" && storageUrl.protocol !== "https:") {
    throw new CatalogMediaConfigurationError("Azure Blob storage must use HTTPS in production.");
  }

  return { serviceUrl: storageUrl.toString(), containerName };
}

export type CatalogMediaObjectStore = Readonly<{
  upload: (
    storageKey: string,
    image: ProcessedCatalogMedia,
  ) => Promise<void>;
  delete: (storageKey: string) => Promise<void>;
}>;

async function getPublicProductMediaObjectStore(): Promise<CatalogMediaObjectStore> {
  const { serviceUrl, containerName } = productMediaBlobConfiguration();
  const service = new BlobServiceClient(serviceUrl, new DefaultAzureCredential());
  const container = service.getContainerClient(containerName);
  try {
    const properties = await container.getProperties();
    if (properties.blobPublicAccess !== "blob") {
      throw new CatalogMediaConfigurationError(
        "The existing product-media container must allow anonymous Blob reads without container listing.",
      );
    }
  } catch (error) {
    if (error instanceof CatalogMediaConfigurationError) throw error;
    throw new CatalogMediaConfigurationError(
      "The existing public product-media container is unavailable.",
    );
  }

  return {
    async upload(storageKey, image) {
      await container.getBlockBlobClient(storageKey).uploadData(image.bytes, {
        blobHTTPHeaders: {
          blobCacheControl: "private, no-store",
          blobContentDisposition: "inline",
          blobContentType: image.contentType,
        },
        conditions: { ifNoneMatch: "*" },
        metadata: {
          intakerightsstatus: "unverified",
          sha256: image.sha256,
          sourcecontenttype: image.sourceContentType,
          transformedformat: "webp",
        },
      });
    },
    async delete(storageKey) {
      await container
        .getBlockBlobClient(storageKey)
        .deleteIfExists({ deleteSnapshots: "include" });
    },
  };
}

type PersistCatalogMedia = typeof createUnverifiedProductMedia;

export type CatalogMediaIntakeDependencies = Readonly<{
  objectStore?: CatalogMediaObjectStore;
  persist?: PersistCatalogMedia;
  randomId?: () => string;
  now?: () => Date;
}>;

async function cleanupFailedPersistence(
  objectStore: CatalogMediaObjectStore,
  storageKey: string,
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await objectStore.delete(storageKey);
      return;
    } catch {
      // Retry boundedly; the deployment orphan reconciler remains the last-resort control.
    }
  }
  throw new CatalogMediaCleanupError();
}

export async function intakeCatalogProductMedia(
  {
    actor,
    productId,
    file,
    altText,
    sourceUrl,
  }: {
    actor: CatalogAdminActor;
    productId: string;
    file: File;
    altText: string;
    sourceUrl: string;
  },
  dependencies: CatalogMediaIntakeDependencies = {},
) {
  if (actor.role !== AdminRole.OWNER) {
    throw new CatalogManagementError("OWNER_REQUIRED");
  }
  const hearingAidId = productIdSchema.parse(productId);
  const accessibleAltText = altTextSchema.parse(altText);
  const exactSourceUrl = sourceUrlSchema.parse(sourceUrl);
  const image = await processCatalogMediaImage(file);
  const objectStore = dependencies.objectStore ?? await getPublicProductMediaObjectStore();
  const generatedId = (dependencies.randomId ?? randomUUID)();
  const assetId = z.string().uuid().parse(generatedId);
  const timestamp = (dependencies.now ?? (() => new Date()))();
  if (Number.isNaN(timestamp.getTime())) {
    throw new CatalogMediaIntakeError("INVALID_INPUT", "The upload timestamp is invalid.");
  }
  const year = String(timestamp.getUTCFullYear()).padStart(4, "0");
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, "0");
  const storageKey = `catalog/${year}/${month}/${assetId}.webp`;

  await objectStore.upload(storageKey, image);
  const persist = dependencies.persist ?? createUnverifiedProductMedia;
  try {
    const media = await persist({
      actor,
      productId: hearingAidId,
      storageKey,
      altText: accessibleAltText,
      contentType: image.contentType,
      width: image.width,
      height: image.height,
      sourceUrl: exactSourceUrl,
      sha256: image.sha256,
    });
    return { media, storageKey, sha256: image.sha256 };
  } catch (error) {
    await cleanupFailedPersistence(objectStore, storageKey);
    throw error;
  }
}
