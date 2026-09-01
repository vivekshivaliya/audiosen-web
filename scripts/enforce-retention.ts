import {
  AdminRole,
  EnquiryStatus,
  UploadSessionStatus,
  type Prisma,
} from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/db";
import {
  isPrivateAttachmentStorageKey,
  retainedAttachmentDeletionWhere,
  retainedEnquiryDeletionWhere,
  retainedOutboxDeletionWhere,
  retentionCutoffs,
  RETENTION_POLICY_VERSION,
} from "@/lib/enquiries/retention-policy";
import { requestFingerprint } from "@/lib/enquiries/security";
import { getPrivateUploadContainer } from "@/lib/uploads/intake";

const DELETE_CHUNK_SIZE = 500;

function chunks<T>(values: T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += DELETE_CHUNK_SIZE) {
    result.push(values.slice(index, index + DELETE_CHUNK_SIZE));
  }
  return result;
}

async function configuredOwner(email: string) {
  const normalized = email.trim().toLowerCase();
  const owner = await getPrisma().adminUser.findFirst({
    where: { email: normalized, role: AdminRole.OWNER, active: true },
    select: { id: true, email: true },
  });
  if (!owner || process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase() !== owner.email) {
    throw new Error("Retention approval requires the active configured OWNER account.");
  }
  return owner;
}

async function main() {
  if (!isDatabaseConfigured()) throw new Error("DATABASE_URL is required.");
  const commit = process.argv.includes("--commit");
  const confirmation = process.argv.includes("--confirm-retention");
  const approvalIndex = process.argv.indexOf("--approved-by");
  const approvedBy = approvalIndex >= 0 ? process.argv[approvalIndex + 1] : undefined;
  const retentionMonths = Number(process.env.ENQUIRY_RETENTION_MONTHS || "24");
  if (!Number.isInteger(retentionMonths) || retentionMonths < 6 || retentionMonths > 120) {
    throw new Error("ENQUIRY_RETENTION_MONTHS must be an integer from 6 to 120.");
  }

  const now = new Date();
  const cutoffs = retentionCutoffs(now, retentionMonths);
  const prisma = getPrisma();
  const enquiryWhere = retainedEnquiryDeletionWhere(cutoffs);
  const candidateEnquiries = await prisma.enquiry.findMany({
    where: enquiryWhere,
    select: { id: true, status: true },
  });
  const enquiryIds = candidateEnquiries.map((enquiry) => enquiry.id);

  const uploadSessionWhere: Prisma.UploadSessionWhereInput = {
    OR: [
      ...(enquiryIds.length > 0 ? [{ enquiryId: { in: enquiryIds } }] : []),
      {
        enquiryId: null,
        OR: [
          { expiresAt: { lte: now } },
          { status: { in: [UploadSessionStatus.EXPIRED, UploadSessionStatus.REJECTED] } },
        ],
      },
    ],
  };

  const [outboxRows, retainedAttachments, googleSnapshots, googleReviews, adminSessions, uploadSessions] =
    await Promise.all([
      prisma.emailOutbox.findMany({
        where: retainedOutboxDeletionWhere(cutoffs, enquiryIds),
        select: { id: true },
      }),
      prisma.enquiryAttachment.findMany({
        where: retainedAttachmentDeletionWhere(cutoffs, enquiryIds),
        select: { id: true, storageKey: true, uploadSessionId: true },
      }),
      prisma.googleSnapshot.count({ where: { expiresAt: { lte: now } } }),
      prisma.googleReview.count({ where: { expiresAt: { lte: now } } }),
      prisma.adminSession.count({
        where: {
          OR: [
            { expiresAt: { lte: now } },
            { revokedAt: { not: null, lte: cutoffs.revokedSession } },
          ],
        },
      }),
      prisma.uploadSession.findMany({
        where: uploadSessionWhere,
        select: {
          id: true,
          attachments: { select: { id: true, storageKey: true, uploadSessionId: true } },
        },
      }),
    ]);

  const attachmentTargets = new Map(
    retainedAttachments.map((attachment) => [attachment.id, attachment]),
  );
  for (const session of uploadSessions) {
    for (const attachment of session.attachments) {
      attachmentTargets.set(attachment.id, attachment);
    }
  }
  const attachments = [...attachmentTargets.values()];
  for (const attachment of attachments) {
    if (!isPrivateAttachmentStorageKey(attachment.storageKey)) {
      throw new Error("Retention stopped because a private attachment storage key is invalid.");
    }
  }

  const blobKeys = [...new Set(attachments.map((attachment) => attachment.storageKey))];
  const outboxIds = outboxRows.map((row) => row.id);
  const attachmentIds = attachments.map((attachment) => attachment.id);
  const uploadSessionIds = uploadSessions.map((session) => session.id);
  const affectedUploadSessionIds = [
    ...new Set(attachments.map((attachment) => attachment.uploadSessionId)),
  ];
  const candidateSetHash = requestFingerprint({
    enquiries: [...enquiryIds].sort(),
    outbox: [...outboxIds].sort(),
    attachments: [...attachmentIds].sort(),
    uploadSessions: [...uploadSessionIds].sort(),
    blobKeys: [...blobKeys].sort(),
  });
  const spamEnquiries = candidateEnquiries.filter(
    (enquiry) => enquiry.status === EnquiryStatus.SPAM,
  ).length;
  const counts = {
    spamEnquiries,
    unconvertedEnquiries: candidateEnquiries.length - spamEnquiries,
    enquiries: candidateEnquiries.length,
    outbox: outboxRows.length,
    privateAttachments: attachments.length,
    privateAttachmentBlobs: blobKeys.length,
    googleSnapshots,
    googleReviews,
    adminSessions,
    uploadSessions: uploadSessions.length,
  };
  const policyHash = requestFingerprint({
    policyVersion: RETENTION_POLICY_VERSION,
    retentionMonths,
    candidateSetHash,
    counts,
  });

  if (!commit) {
    console.info("Retention dry run complete", {
      policyHash,
      policyVersion: RETENTION_POLICY_VERSION,
      retentionMonths,
      candidateSetHash,
      ...counts,
    });
    console.info("No data was removed. Owner approval and explicit commit flags are required.");
    return;
  }
  if (!confirmation || !approvedBy) {
    throw new Error("--commit requires --confirm-retention and --approved-by <owner email>.");
  }
  const owner = await configuredOwner(approvedBy);

  if (blobKeys.length > 0) {
    const container = await getPrivateUploadContainer();
    for (const storageKey of blobKeys) {
      await container.getBlockBlobClient(storageKey).deleteIfExists({ deleteSnapshots: "include" });
    }
  }

  const cutoffMetadata = Object.fromEntries(
    Object.entries(cutoffs).map(([name, date]) => [name, date.toISOString()]),
  );

  await prisma.$transaction(async (transaction) => {
    for (const ids of chunks(outboxIds)) {
      await transaction.emailOutbox.deleteMany({ where: { id: { in: ids } } });
    }
    for (const ids of chunks(attachmentIds)) {
      await transaction.enquiryAttachment.deleteMany({ where: { id: { in: ids } } });
    }
    for (const ids of chunks(uploadSessionIds)) {
      await transaction.uploadSession.deleteMany({ where: { id: { in: ids } } });
    }
    for (const ids of chunks(enquiryIds)) {
      await transaction.enquiry.deleteMany({ where: { id: { in: ids } } });
    }
    for (const ids of chunks(affectedUploadSessionIds)) {
      await transaction.uploadSession.deleteMany({
        where: { id: { in: ids }, attachments: { none: {} } },
      });
    }
    await transaction.googleReview.deleteMany({ where: { expiresAt: { lte: now } } });
    await transaction.googleSnapshot.deleteMany({ where: { expiresAt: { lte: now } } });
    await transaction.adminSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lte: now } },
          { revokedAt: { not: null, lte: cutoffs.revokedSession } },
        ],
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId: owner.id,
        action: "retention.completed",
        entityType: "RetentionRun",
        entityId: policyHash,
        metadata: {
          policyHash,
          candidateSetHash,
          policyVersion: RETENTION_POLICY_VERSION,
          retentionMonths,
          cutoffs: cutoffMetadata,
          ...counts,
        },
      },
    });
  });
  console.info("Retention run complete", {
    policyHash,
    policyVersion: RETENTION_POLICY_VERSION,
    ...counts,
  });
}

main()
  .catch((error) => {
    console.error("Retention run stopped", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    if (isDatabaseConfigured()) await getPrisma().$disconnect().catch(() => undefined);
  });
