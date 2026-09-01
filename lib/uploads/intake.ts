import { createHash, randomBytes, randomUUID } from "node:crypto";
import path from "node:path";
import { BlobServiceClient, RestError } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { AttachmentPurpose, AttachmentScanStatus, UploadSessionStatus } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  assertUploadVerificationGrantConfigured,
  createUploadVerificationGrant,
  type UploadVerificationPurpose,
} from "@/lib/uploads/verification-grant";

type PublicUploadPurpose = UploadVerificationPurpose;

type UploadClientContext = {
  ip: string;
  userAgent: string;
};

const PURPOSES: Record<
  PublicUploadPurpose,
  { databasePurpose: AttachmentPurpose; maxBytes: number; mimeTypes: Set<string> }
> = {
  device_photo: {
    databasePurpose: AttachmentPurpose.DEVICE_PHOTO,
    maxBytes: 8 * 1024 * 1024,
    mimeTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
  },
  audiogram: {
    databasePurpose: AttachmentPurpose.AUDIOGRAM,
    maxBytes: 10 * 1024 * 1024,
    mimeTypes: new Set(["application/pdf", "image/jpeg", "image/png"]),
  },
};

export class UploadNotConfiguredError extends Error {
  constructor(message = "Secure upload storage is not configured.") {
    super(message);
    this.name = "UploadNotConfiguredError";
  }
}

export class UploadValidationError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadValidationError";
    this.status = status;
  }
}

export function parseUploadPurpose(value: unknown): PublicUploadPurpose {
  if (value === "device_photo" || value === "audiogram") return value;
  throw new UploadValidationError("Upload purpose must be device_photo or audiogram.");
}

export function detectUploadMimeType(bytes: Uint8Array): string | undefined {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") {
    return "application/pdf";
  }
  return undefined;
}

function safeOriginalName(name: string): string {
  const basename = path.basename(name).replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (basename || "upload").slice(0, 255);
}

function blobConfiguration(): { serviceUrl: string; containerName: string } {
  const serviceUrl = process.env.AZURE_BLOB_SERVICE_URL?.trim();
  const containerName = process.env.AZURE_BLOB_CONTAINER?.trim();
  if (!serviceUrl || !containerName || !isDatabaseConfigured()) {
    throw new UploadNotConfiguredError();
  }
  let url: URL;
  try {
    url = new URL(serviceUrl);
  } catch {
    throw new UploadNotConfiguredError("AZURE_BLOB_SERVICE_URL is invalid.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new UploadNotConfiguredError("Azure Blob storage must use HTTPS in production.");
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(containerName)) {
    throw new UploadNotConfiguredError("AZURE_BLOB_CONTAINER is invalid.");
  }
  return { serviceUrl: url.toString(), containerName };
}

export async function getPrivateUploadContainer() {
  const { serviceUrl, containerName } = blobConfiguration();
  const service = new BlobServiceClient(serviceUrl, new DefaultAzureCredential());
  const container = service.getContainerClient(containerName);

  try {
    const properties = await container.getProperties();
    if (properties.blobPublicAccess) {
      throw new UploadNotConfiguredError("The configured upload container must not allow public access.");
    }
  } catch (error) {
    const statusCode = error instanceof RestError ? error.statusCode : undefined;
    if (statusCode === 404 && process.env.AZURE_BLOB_CREATE_PRIVATE_CONTAINER === "true") {
      await container.createIfNotExists();
    } else if (error instanceof UploadNotConfiguredError) {
      throw error;
    } else {
      throw new UploadNotConfiguredError("The private upload container is unavailable.");
    }
  }
  return container;
}

export async function intakeUpload(
  file: File,
  purpose: PublicUploadPurpose,
  client: UploadClientContext,
) {
  assertUploadVerificationGrantConfigured();
  const policy = PURPOSES[purpose];
  if (file.size < 1) throw new UploadValidationError("The selected file is empty.");
  if (file.size > policy.maxBytes) {
    throw new UploadValidationError(
      `The selected file exceeds the ${Math.floor(policy.maxBytes / 1024 / 1024)} MB limit.`,
      413,
    );
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectUploadMimeType(bytes);
  const declared = file.type.toLowerCase();
  if (!detected || !policy.mimeTypes.has(detected) || declared !== detected) {
    throw new UploadValidationError("The file content does not match an allowed file type.", 415);
  }

  const container = await getPrivateUploadContainer();
  const attachmentId = randomUUID();
  const uploadSessionId = randomUUID();
  const claimToken = randomBytes(32).toString("base64url");
  const claimTokenHash = createHash("sha256").update(claimToken).digest("hex");
  const digest = createHash("sha256").update(bytes).digest("hex");
  const datePrefix = new Date().toISOString().slice(0, 10).replaceAll("-", "/");
  const storageKey = `quarantine/${purpose}/${datePrefix}/${attachmentId}`;
  const expiresAt = new Date(Date.now() + 30 * 60_000);
  const verificationGrant = createUploadVerificationGrant({
    attachmentId,
    claimToken,
    purpose,
    expiresAt,
    ...client,
  });
  const blockBlob = container.getBlockBlobClient(storageKey);

  await blockBlob.uploadData(bytes, {
    blobHTTPHeaders: { blobContentType: detected, blobCacheControl: "no-store" },
    metadata: { purpose, attachmentid: attachmentId, scanstatus: "pending" },
    conditions: { ifNoneMatch: "*" },
  });

  try {
    await getPrisma().uploadSession.create({
      data: {
        id: uploadSessionId,
        claimTokenHash,
        purpose: policy.databasePurpose,
        status: UploadSessionStatus.READY,
        expiresAt,
        attachments: {
          create: {
            id: attachmentId,
            purpose: policy.databasePurpose,
            storageKey,
            originalName: safeOriginalName(file.name),
            contentType: detected,
            sizeBytes: file.size,
            sha256: digest,
            scanStatus: AttachmentScanStatus.PENDING,
          },
        },
      },
    });
  } catch {
    await blockBlob.deleteIfExists({ deleteSnapshots: "include" }).catch(() => undefined);
    throw new UploadNotConfiguredError("Upload metadata persistence is unavailable.");
  }

  return {
    attachmentId,
    claimToken,
    verificationGrant,
    purpose,
    status: "quarantined" as const,
    expiresAt: expiresAt.toISOString(),
  };
}
