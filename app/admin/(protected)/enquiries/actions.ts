"use server";

import { randomBytes } from "node:crypto";
import { AdminRole, EmailOutboxStatus, EnquiryStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/auth";
import { getPrisma } from "@/lib/db";
import { encryptEnquiryPayload } from "@/lib/enquiries/encryption";

const identifierSchema = z.string().uuid();
const statusSchema = z.nativeEnum(EnquiryStatus);

async function refreshEnquiry(enquiryId: string) {
  const enquiry = await getPrisma().enquiry.findUnique({
    where: { id: enquiryId },
    select: { reference: true },
  });
  revalidatePath("/admin/enquiries");
  if (enquiry) revalidatePath(`/admin/enquiries/${enquiry.reference}`);
}

export async function updateEnquiryStatus(formData: FormData) {
  const admin = await requireAdmin();
  const enquiryId = identifierSchema.parse(formData.get("enquiryId"));
  const status = statusSchema.parse(formData.get("status"));
  await getPrisma().$transaction(async (transaction) => {
    const existing = await transaction.enquiry.findUniqueOrThrow({
      where: { id: enquiryId },
      select: { status: true },
    });
    if (existing.status === status) return;
    await transaction.enquiry.update({ where: { id: enquiryId }, data: { status } });
    await transaction.auditLog.create({
      data: {
        actorId: admin.id,
        action: "enquiry.status_changed",
        entityType: "Enquiry",
        entityId: enquiryId,
        metadata: { from: existing.status, to: status },
      },
    });
  });
  await refreshEnquiry(enquiryId);
}

export async function addEnquiryNote(formData: FormData) {
  const admin = await requireAdmin();
  const enquiryId = identifierSchema.parse(formData.get("enquiryId"));
  const body = z.string().trim().min(1).max(4000).parse(formData.get("body"));
  const encrypted = encryptEnquiryPayload({ body });
  await getPrisma().$transaction([
    getPrisma().leadNote.create({
      data: {
        enquiryId,
        authorId: admin.id,
        bodyCiphertext: encrypted.ciphertext,
        bodyNonce: encrypted.nonce,
        bodyAuthTag: encrypted.authTag,
        keyVersion: encrypted.keyVersion,
      },
    }),
    getPrisma().auditLog.create({
      data: {
        actorId: admin.id,
        action: "enquiry.note_added",
        entityType: "Enquiry",
        entityId: enquiryId,
        metadata: { encrypted: true },
      },
    }),
  ]);
  await refreshEnquiry(enquiryId);
}

export async function scheduleEnquiryFollowUp(formData: FormData) {
  const admin = await requireAdmin();
  const enquiryId = identifierSchema.parse(formData.get("enquiryId"));
  const localDueAt = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    .parse(formData.get("dueAt"));
  const dueAt = new Date(`${localDueAt}:00+05:30`);
  if (Number.isNaN(dueAt.getTime())) throw new Error("Invalid follow-up date.");
  const note = z.string().trim().max(1000).parse(formData.get("note") || "");
  const encrypted = note ? encryptEnquiryPayload({ note }) : undefined;

  await getPrisma().$transaction([
    getPrisma().followUp.create({
      data: {
        enquiryId,
        createdById: admin.id,
        assignedToId: admin.id,
        dueAt,
        noteCiphertext: encrypted?.ciphertext,
        noteNonce: encrypted?.nonce,
        noteAuthTag: encrypted?.authTag,
        keyVersion: encrypted?.keyVersion,
      },
    }),
    getPrisma().auditLog.create({
      data: {
        actorId: admin.id,
        action: "enquiry.follow_up_scheduled",
        entityType: "Enquiry",
        entityId: enquiryId,
        metadata: { dueAt: dueAt.toISOString(), encryptedNote: Boolean(encrypted) },
      },
    }),
  ]);
  await refreshEnquiry(enquiryId);
}

export async function retryEnquiryEmail(formData: FormData) {
  const admin = await requireAdmin([AdminRole.OWNER, AdminRole.ADMIN]);
  const outboxId = identifierSchema.parse(formData.get("outboxId"));
  const prisma = getPrisma();
  const original = await prisma.emailOutbox.findUniqueOrThrow({ where: { id: outboxId } });
  if (!original.enquiryId) throw new Error("This email is not attached to an enquiry.");

  let queuedOutboxId = original.id;
  await prisma.$transaction(async (transaction) => {
    if (original.status === EmailOutboxStatus.FAILED) {
      await transaction.emailOutbox.update({
        where: { id: original.id },
        data: {
          status: EmailOutboxStatus.PENDING,
          nextAttemptAt: new Date(),
          lockedAt: null,
        },
      });
    } else if (original.status === EmailOutboxStatus.DEAD) {
      const replacement = await transaction.emailOutbox.create({
        data: {
          enquiryId: original.enquiryId,
          kind: original.kind,
          dedupeKey: `manual:${original.id}:${randomBytes(8).toString("hex")}`,
          fromAddress: original.fromAddress,
          toAddress: original.toAddress,
          replyToAddress: original.replyToAddress,
          subject: original.subject,
          textBody: original.textBody,
          htmlBody: original.htmlBody,
          nextAttemptAt: new Date(),
        },
      });
      queuedOutboxId = replacement.id;
    } else {
      throw new Error("Only failed or dead email can be retried.");
    }
    await transaction.auditLog.create({
      data: {
        actorId: admin.id,
        action: "enquiry.email_retry_queued",
        entityType: "EmailOutbox",
        entityId: queuedOutboxId,
        metadata: { originalOutboxId: original.id, previousStatus: original.status },
      },
    });
  });
  await refreshEnquiry(original.enquiryId);
}
