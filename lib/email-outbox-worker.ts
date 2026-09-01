import { EmailOutboxStatus, type PrismaClient } from "@prisma/client";
import { getPrisma } from "./db";
import { AzureEmailDeliveryError, sendQueuedEmail } from "./mailer";

const BATCH_SIZE = 20;
const STALE_LOCK_MS = 10 * 60_000;

let workerPrisma: PrismaClient | undefined;

export type EmailOutboxBatchResult = {
  claimed: number;
  delivered: number;
  failed: number;
  dead: number;
  staleLocksRecovered: number;
};

export type EmailOutboxWorkerOptions = {
  prisma?: PrismaClient;
  sendEmail?: typeof sendQueuedEmail;
  now?: () => Date;
  logger?: Pick<Console, "info" | "error">;
};

function prismaClient(): PrismaClient {
  workerPrisma ??= getPrisma();
  return workerPrisma;
}

function safeError(error: unknown): {
  code: string;
  message: string;
  providerMessageId?: string;
  providerStatus?: string;
} {
  if (error instanceof AzureEmailDeliveryError) {
    return {
      code: [error.name, error.providerErrorCode].filter(Boolean).join(":").slice(0, 160),
      message: "ACS Email returned a terminal non-success status; inspect provider telemetry by outbox ID.",
      providerMessageId: error.providerMessageId,
      providerStatus: error.providerStatus,
    };
  }
  const value = error as { name?: string; code?: string; responseCode?: number } | undefined;
  const code =
    [value?.name, value?.code, value?.responseCode]
      .filter(Boolean)
      .join(":")
      .slice(0, 160) || "unknown";
  return { code, message: "Email provider delivery failed; inspect provider telemetry by outbox ID." };
}

function retryAt(attempt: number, now: Date): Date {
  const minutes = Math.min(360, 2 ** Math.max(0, attempt - 1));
  return new Date(now.getTime() + minutes * 60_000);
}

/**
 * Claims and processes at most one bounded outbox batch.
 *
 * Database claims remain the concurrency boundary, so this contract is safe for
 * both the supervised CLI and overlapping Azure Function instances.
 */
export async function processEmailOutboxBatch(
  options: EmailOutboxWorkerOptions = {},
): Promise<EmailOutboxBatchResult> {
  const prisma = options.prisma ?? prismaClient();
  const clock = options.now ?? (() => new Date());
  const sendEmail = options.sendEmail ?? sendQueuedEmail;
  const logger = options.logger ?? console;
  const result: EmailOutboxBatchResult = {
    claimed: 0,
    delivered: 0,
    failed: 0,
    dead: 0,
    staleLocksRecovered: 0,
  };

  const staleLocks = await prisma.emailOutbox.updateMany({
    where: {
      status: EmailOutboxStatus.PROCESSING,
      lockedAt: { lt: new Date(clock().getTime() - STALE_LOCK_MS) },
    },
    data: {
      status: EmailOutboxStatus.FAILED,
      lockedAt: null,
      nextAttemptAt: clock(),
      lastErrorCode: "stale_lock",
      lastError: "A previous worker lock expired before completion.",
    },
  });
  result.staleLocksRecovered = staleLocks.count;

  const candidates = await prisma.emailOutbox.findMany({
    where: {
      status: { in: [EmailOutboxStatus.PENDING, EmailOutboxStatus.FAILED] },
      nextAttemptAt: { lte: clock() },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  for (const candidate of candidates) {
    if (candidate.attemptCount >= candidate.maxAttempts) {
      await prisma.emailOutbox.update({
        where: { id: candidate.id },
        data: { status: EmailOutboxStatus.DEAD, lockedAt: null },
      });
      result.dead += 1;
      continue;
    }

    const claimed = await prisma.emailOutbox.updateMany({
      where: {
        id: candidate.id,
        status: candidate.status,
        lockedAt: null,
        attemptCount: candidate.attemptCount,
      },
      data: {
        status: EmailOutboxStatus.PROCESSING,
        lockedAt: clock(),
        attemptCount: { increment: 1 },
      },
    });
    if (claimed.count !== 1) continue;

    result.claimed += 1;
    const attempt = candidate.attemptCount + 1;

    try {
      const delivery = await sendEmail({
        to: candidate.toAddress,
        replyTo: candidate.replyToAddress || undefined,
        subject: candidate.subject,
        text: candidate.textBody,
        html: candidate.htmlBody,
        operationId: candidate.id,
      });
      await prisma.emailOutbox.update({
        where: { id: candidate.id },
        data: {
          status: EmailOutboxStatus.SENT,
          sentAt: clock(),
          lockedAt: null,
          providerMessageId: delivery.providerMessageId,
          providerStatus: delivery.providerStatus,
          providerCheckedAt: clock(),
          lastErrorCode: null,
          lastError: null,
        },
      });
      result.delivered += 1;
      logger.info("Outbox email delivered", { outboxId: candidate.id, kind: candidate.kind });
    } catch (error) {
      const safe = safeError(error);
      const exhausted = attempt >= candidate.maxAttempts;
      await prisma.emailOutbox.update({
        where: { id: candidate.id },
        data: {
          status: exhausted ? EmailOutboxStatus.DEAD : EmailOutboxStatus.FAILED,
          lockedAt: null,
          nextAttemptAt: retryAt(attempt, clock()),
          ...(safe.providerMessageId ? { providerMessageId: safe.providerMessageId } : {}),
          ...(safe.providerStatus ? { providerStatus: safe.providerStatus } : {}),
          providerCheckedAt: clock(),
          lastErrorCode: safe.code,
          lastError: safe.message,
        },
      });
      if (exhausted) result.dead += 1;
      else result.failed += 1;
      logger.error("Outbox email delivery failed", {
        outboxId: candidate.id,
        kind: candidate.kind,
        attempt,
        code: safe.code,
      });
    }
  }

  return result;
}

export async function probeEmailOutboxDatabase(): Promise<void> {
  await prismaClient().$queryRaw`SELECT 1`;
}

export async function disconnectEmailOutboxWorker(): Promise<void> {
  const prisma = workerPrisma;
  workerPrisma = undefined;
  if (prisma) await prisma.$disconnect();
}
