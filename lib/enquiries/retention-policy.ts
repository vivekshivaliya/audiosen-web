import { EmailOutboxStatus, EnquiryStatus, type Prisma } from "@prisma/client";

export const RETENTION_POLICY_VERSION = "website-retention-v1-2026-08-22";
export const SPAM_RETENTION_DAYS = 30;
export const CLOSED_ATTACHMENT_RETENTION_DAYS = 90;
export const MAX_ATTACHMENT_RETENTION_MONTHS = 12;
export const OUTBOX_RETENTION_DAYS = 30;
export const REVOKED_SESSION_RETENTION_DAYS = 7;

const MILLISECONDS_PER_DAY = 24 * 60 * 60_000;

export const UNCONVERTED_ENQUIRY_STATUSES = [
  EnquiryStatus.NEW,
  EnquiryStatus.CONTACTED,
  EnquiryStatus.APPOINTMENT_BOOKED,
  EnquiryStatus.QUALIFIED,
  EnquiryStatus.CLOSED,
] as const;

export type RetentionCutoffs = {
  spam: Date;
  unconvertedEnquiry: Date;
  closedAttachment: Date;
  maximumAttachment: Date;
  deliveredOutbox: Date;
  revokedSession: Date;
};

export function daysBefore(now: Date, days: number): Date {
  return new Date(now.getTime() - days * MILLISECONDS_PER_DAY);
}

export function calendarMonthsBefore(now: Date, months: number): Date {
  const absoluteMonth = now.getUTCFullYear() * 12 + now.getUTCMonth() - months;
  const year = Math.floor(absoluteMonth / 12);
  const month = absoluteMonth - year * 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(
      year,
      month,
      Math.min(now.getUTCDate(), lastDay),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  );
}

export function retentionCutoffs(now: Date, unconvertedMonths: number): RetentionCutoffs {
  return {
    spam: daysBefore(now, SPAM_RETENTION_DAYS),
    unconvertedEnquiry: calendarMonthsBefore(now, unconvertedMonths),
    closedAttachment: daysBefore(now, CLOSED_ATTACHMENT_RETENTION_DAYS),
    maximumAttachment: calendarMonthsBefore(now, MAX_ATTACHMENT_RETENTION_MONTHS),
    deliveredOutbox: daysBefore(now, OUTBOX_RETENTION_DAYS),
    revokedSession: daysBefore(now, REVOKED_SESSION_RETENTION_DAYS),
  };
}

export function spamEnquiryWhere(cutoffs: RetentionCutoffs): Prisma.EnquiryWhereInput {
  return { status: EnquiryStatus.SPAM, updatedAt: { lte: cutoffs.spam } };
}

export function unconvertedEnquiryWhere(cutoffs: RetentionCutoffs): Prisma.EnquiryWhereInput {
  return {
    status: { in: [...UNCONVERTED_ENQUIRY_STATUSES] },
    updatedAt: { lte: cutoffs.unconvertedEnquiry },
  };
}

export function retainedEnquiryDeletionWhere(
  cutoffs: RetentionCutoffs,
): Prisma.EnquiryWhereInput {
  return {
    OR: [spamEnquiryWhere(cutoffs), unconvertedEnquiryWhere(cutoffs)],
  };
}

export function retainedAttachmentDeletionWhere(
  cutoffs: RetentionCutoffs,
  enquiryIds: string[],
): Prisma.EnquiryAttachmentWhereInput {
  return {
    OR: [
      ...(enquiryIds.length > 0 ? [{ enquiryId: { in: enquiryIds } }] : []),
      { createdAt: { lte: cutoffs.maximumAttachment } },
      {
        enquiry: {
          is: {
            status: EnquiryStatus.CLOSED,
            updatedAt: { lte: cutoffs.closedAttachment },
          },
        },
      },
    ],
  };
}

export function retainedOutboxDeletionWhere(
  cutoffs: RetentionCutoffs,
  enquiryIds: string[],
): Prisma.EmailOutboxWhereInput {
  return {
    OR: [
      ...(enquiryIds.length > 0 ? [{ enquiryId: { in: enquiryIds } }] : []),
      {
        status: EmailOutboxStatus.SENT,
        OR: [
          { sentAt: { lte: cutoffs.deliveredOutbox } },
          { sentAt: null, updatedAt: { lte: cutoffs.deliveredOutbox } },
        ],
      },
      {
        status: EmailOutboxStatus.DEAD,
        updatedAt: { lte: cutoffs.deliveredOutbox },
      },
    ],
  };
}

export function isPrivateAttachmentStorageKey(storageKey: string): boolean {
  return (
    storageKey.length >= 10 &&
    storageKey.length <= 500 &&
    /^(?:quarantine|clean)\/[a-z0-9_-]+(?:\/[a-z0-9_-]+)+$/u.test(storageKey) &&
    !storageKey.includes("//")
  );
}
