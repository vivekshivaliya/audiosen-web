import { createHash } from "node:crypto";
import { AttachmentScanStatus } from "@prisma/client";
import sharp from "sharp";
import { getPrisma } from "@/lib/db";
import { getPrivateUploadContainer } from "@/lib/uploads/intake";

const SCAN_RESULT_TAG = "Malware scanning scan result";

async function stripImageMetadata(bytes: Buffer, contentType: string): Promise<Buffer> {
  const image = sharp(bytes, { failOn: "error" }).rotate();
  if (contentType === "image/jpeg") return image.jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  if (contentType === "image/png") return image.png({ compressionLevel: 9 }).toBuffer();
  if (contentType === "image/webp") return image.webp({ quality: 90 }).toBuffer();
  throw new Error("unsupported_image_type");
}

async function processBatch(): Promise<number> {
  if (process.env.UPLOAD_SCAN_RESULT_MODE !== "defender-tags") {
    throw new Error(
      "UPLOAD_SCAN_RESULT_MODE=defender-tags is required after Defender for Storage and scan-result delivery are enabled.",
    );
  }
  const prisma = getPrisma();
  const container = await getPrivateUploadContainer();
  const pending = await prisma.enquiryAttachment.findMany({
    where: { scanStatus: AttachmentScanStatus.PENDING },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  let processed = 0;

  for (const attachment of pending) {
    const quarantineBlob = container.getBlockBlobClient(attachment.storageKey);
    const tags = (await quarantineBlob.getTags()).tags;
    const result = tags[SCAN_RESULT_TAG];
    if (!result) continue;

    if (result === "Malicious") {
      await quarantineBlob.deleteIfExists({ deleteSnapshots: "include" });
      await prisma.enquiryAttachment.update({
        where: { id: attachment.id },
        data: {
          scanStatus: AttachmentScanStatus.REJECTED,
          scannedAt: new Date(),
          scanDetail: "defender_malicious_deleted",
        },
      });
      processed += 1;
      continue;
    }

    if (result !== "No threats found") {
      await prisma.enquiryAttachment.update({
        where: { id: attachment.id },
        data: {
          scanStatus: AttachmentScanStatus.ERROR,
          scannedAt: new Date(),
          scanDetail: `defender_${result.toLowerCase().replaceAll(" ", "_")}`.slice(0, 500),
        },
      });
      processed += 1;
      continue;
    }

    if (!attachment.contentType.startsWith("image/")) {
      await prisma.enquiryAttachment.update({
        where: { id: attachment.id },
        data: {
          scanStatus: AttachmentScanStatus.ERROR,
          scannedAt: new Date(),
          scanDetail: "pdf_metadata_sanitizer_not_configured",
        },
      });
      processed += 1;
      continue;
    }

    const original = await quarantineBlob.downloadToBuffer(0, attachment.sizeBytes);
    let sanitized: Buffer;
    try {
      sanitized = await stripImageMetadata(original, attachment.contentType);
    } catch {
      await prisma.enquiryAttachment.update({
        where: { id: attachment.id },
        data: {
          scanStatus: AttachmentScanStatus.ERROR,
          scannedAt: new Date(),
          scanDetail: "image_decode_or_metadata_strip_failed",
        },
      });
      processed += 1;
      continue;
    }
    const cleanKey = `clean/${attachment.purpose.toLowerCase()}/${attachment.id}`;
    const cleanBlob = container.getBlockBlobClient(cleanKey);
    await cleanBlob.uploadData(sanitized, {
      blobHTTPHeaders: { blobContentType: attachment.contentType, blobCacheControl: "private, no-store" },
      metadata: { attachmentid: attachment.id, scanstatus: "clean", metadatastripped: "true" },
    });
    await prisma.enquiryAttachment.update({
      where: { id: attachment.id },
      data: {
        storageKey: cleanKey,
        sizeBytes: sanitized.byteLength,
        sha256: createHash("sha256").update(sanitized).digest("hex"),
        scanStatus: AttachmentScanStatus.CLEAN,
        scannedAt: new Date(),
        scanDetail: "defender_no_threats_image_metadata_stripped",
      },
    });
    await quarantineBlob.deleteIfExists({ deleteSnapshots: "include" });
    processed += 1;
  }
  return processed;
}

processBatch()
  .then((processed) => console.info("Upload quarantine batch complete", { processed }))
  .catch((error) => {
    console.error("Upload quarantine worker stopped", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    process.exitCode = 1;
  })
  .finally(async () => getPrisma().$disconnect().catch(() => undefined));
