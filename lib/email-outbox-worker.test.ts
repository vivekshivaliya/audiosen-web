import {
  EmailOutboxKind,
  EmailOutboxStatus,
  type EmailOutbox,
  type PrismaClient,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  processEmailOutboxBatch,
  type EmailOutboxWorkerOptions,
} from "./email-outbox-worker";

const now = new Date("2026-08-22T12:00:00.000Z");

function candidate(overrides: Partial<EmailOutbox> = {}): EmailOutbox {
  return {
    id: "76a4d225-421c-463b-a1b1-8e0acef14087",
    enquiryId: null,
    kind: EmailOutboxKind.STAFF_ENQUIRY,
    status: EmailOutboxStatus.PENDING,
    dedupeKey: "fixture:staff",
    fromAddress: "contactaudiosen@gmail.com",
    toAddress: "vivekshivaliya10@gmail.com",
    replyToAddress: null,
    subject: "Fixture subject",
    textBody: "Fixture body",
    htmlBody: "<p>Fixture body</p>",
    attemptCount: 0,
    maxAttempts: 8,
    nextAttemptAt: now,
    lockedAt: null,
    sentAt: null,
    providerMessageId: null,
    providerStatus: null,
    providerCheckedAt: null,
    lastErrorCode: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function mockPrisma(rows: EmailOutbox[], claimCount = 1) {
  const updateMany = vi
    .fn()
    .mockResolvedValueOnce({ count: 1 })
    .mockResolvedValueOnce({ count: claimCount });
  const findMany = vi.fn().mockResolvedValue(rows);
  const update = vi.fn().mockResolvedValue({});
  const prisma = { emailOutbox: { updateMany, findMany, update } } as unknown as PrismaClient;
  return { prisma, updateMany, findMany, update };
}

function quietLogger(): NonNullable<EmailOutboxWorkerOptions["logger"]> {
  return { info: vi.fn(), error: vi.fn() };
}

describe("shared email outbox worker", () => {
  it("recovers stale locks, claims conditionally, sends once, and records provider delivery", async () => {
    const database = mockPrisma([candidate()]);
    const sendEmail = vi.fn().mockResolvedValue({
      providerMessageId: "provider-message-id",
      providerStatus: "Succeeded",
    });

    const result = await processEmailOutboxBatch({
      prisma: database.prisma,
      sendEmail,
      now: () => now,
      logger: quietLogger(),
    });

    expect(result).toEqual({
      claimed: 1,
      delivered: 1,
      failed: 0,
      dead: 0,
      staleLocksRecovered: 1,
    });
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "vivekshivaliya10@gmail.com",
        operationId: "76a4d225-421c-463b-a1b1-8e0acef14087",
      }),
    );
    expect(database.update).toHaveBeenLastCalledWith({
      where: { id: "76a4d225-421c-463b-a1b1-8e0acef14087" },
      data: expect.objectContaining({
        status: EmailOutboxStatus.SENT,
        providerMessageId: "provider-message-id",
        providerStatus: "Succeeded",
      }),
    });
  });

  it("does not deliver when another worker wins the conditional claim", async () => {
    const database = mockPrisma([candidate()], 0);
    const sendEmail = vi.fn();

    const result = await processEmailOutboxBatch({
      prisma: database.prisma,
      sendEmail,
      now: () => now,
      logger: quietLogger(),
    });

    expect(result.claimed).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
    expect(database.update).not.toHaveBeenCalled();
  });

  it("stores only a bounded error code and schedules exponential retry", async () => {
    const database = mockPrisma([candidate({ attemptCount: 1 })]);
    const sendEmail = vi.fn().mockRejectedValue({
      name: "RestError",
      code: "TooManyRequests",
      responseCode: 429,
      message: "provider details that must never be persisted",
    });

    const result = await processEmailOutboxBatch({
      prisma: database.prisma,
      sendEmail,
      now: () => now,
      logger: quietLogger(),
    });

    expect(result.failed).toBe(1);
    expect(result.dead).toBe(0);
    expect(database.update).toHaveBeenLastCalledWith({
      where: { id: "76a4d225-421c-463b-a1b1-8e0acef14087" },
      data: expect.objectContaining({
        status: EmailOutboxStatus.FAILED,
        nextAttemptAt: new Date("2026-08-22T12:02:00.000Z"),
        lastErrorCode: "RestError:TooManyRequests:429",
        lastError: "Email provider delivery failed; inspect provider telemetry by outbox ID.",
      }),
    });
    expect(JSON.stringify(database.update.mock.calls)).not.toContain("provider details");
  });

  it("moves an exhausted delivery to DEAD without scheduling another send", async () => {
    const database = mockPrisma([candidate({ attemptCount: 7, maxAttempts: 8 })]);
    const sendEmail = vi.fn().mockRejectedValue(new Error("fixture failure"));

    const result = await processEmailOutboxBatch({
      prisma: database.prisma,
      sendEmail,
      now: () => now,
      logger: quietLogger(),
    });

    expect(result).toEqual(expect.objectContaining({ claimed: 1, failed: 0, dead: 1 }));
    expect(database.update).toHaveBeenLastCalledWith({
      where: { id: "76a4d225-421c-463b-a1b1-8e0acef14087" },
      data: expect.objectContaining({ status: EmailOutboxStatus.DEAD }),
    });
  });

  it("does not call ACS for a candidate that was already out of attempts", async () => {
    const database = mockPrisma([candidate({ attemptCount: 8, maxAttempts: 8 })]);
    const sendEmail = vi.fn();

    const result = await processEmailOutboxBatch({
      prisma: database.prisma,
      sendEmail,
      now: () => now,
      logger: quietLogger(),
    });

    expect(result).toEqual(expect.objectContaining({ claimed: 0, dead: 1 }));
    expect(sendEmail).not.toHaveBeenCalled();
    expect(database.update).toHaveBeenCalledWith({
      where: { id: "76a4d225-421c-463b-a1b1-8e0acef14087" },
      data: { status: EmailOutboxStatus.DEAD, lockedAt: null },
    });
  });
});
