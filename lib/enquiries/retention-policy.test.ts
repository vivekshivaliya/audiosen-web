import { EmailOutboxStatus, EnquiryStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  calendarMonthsBefore,
  isPrivateAttachmentStorageKey,
  retainedAttachmentDeletionWhere,
  retainedEnquiryDeletionWhere,
  retainedOutboxDeletionWhere,
  retentionCutoffs,
} from "./retention-policy";

describe("website retention policy", () => {
  const now = new Date("2026-08-22T12:34:56.000Z");
  const cutoffs = retentionCutoffs(now, 24);

  it("computes policy cutoffs from one stable clock", () => {
    expect(cutoffs.spam.toISOString()).toBe("2026-07-23T12:34:56.000Z");
    expect(cutoffs.unconvertedEnquiry.toISOString()).toBe("2024-08-22T12:34:56.000Z");
    expect(cutoffs.closedAttachment.toISOString()).toBe("2026-05-24T12:34:56.000Z");
    expect(cutoffs.maximumAttachment.toISOString()).toBe("2025-08-22T12:34:56.000Z");
    expect(cutoffs.deliveredOutbox.toISOString()).toBe("2026-07-23T12:34:56.000Z");
  });

  it("clamps calendar-month subtraction at the end of a shorter month", () => {
    expect(calendarMonthsBefore(new Date("2024-02-29T08:00:00.000Z"), 12).toISOString()).toBe(
      "2023-02-28T08:00:00.000Z",
    );
  });

  it("uses updatedAt and never includes converted enquiries", () => {
    const where = retainedEnquiryDeletionWhere(cutoffs);
    expect(where).toEqual({
      OR: [
        { status: EnquiryStatus.SPAM, updatedAt: { lte: cutoffs.spam } },
        {
          status: {
            in: [
              EnquiryStatus.NEW,
              EnquiryStatus.CONTACTED,
              EnquiryStatus.APPOINTMENT_BOOKED,
              EnquiryStatus.QUALIFIED,
              EnquiryStatus.CLOSED,
            ],
          },
          updatedAt: { lte: cutoffs.unconvertedEnquiry },
        },
      ],
    });
    expect(JSON.stringify(where)).not.toContain(EnquiryStatus.CONVERTED);
  });

  it("selects exact enquiry attachments, 90-day closed attachments, and the 12-month maximum", () => {
    expect(retainedAttachmentDeletionWhere(cutoffs, ["enquiry-id"])).toEqual({
      OR: [
        { enquiryId: { in: ["enquiry-id"] } },
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
    });
  });

  it("expires SENT by delivery time and DEAD by last update, never creation alone", () => {
    const where = retainedOutboxDeletionWhere(cutoffs, []);
    expect(where).toEqual({
      OR: [
        {
          status: EmailOutboxStatus.SENT,
          OR: [
            { sentAt: { lte: cutoffs.deliveredOutbox } },
            { sentAt: null, updatedAt: { lte: cutoffs.deliveredOutbox } },
          ],
        },
        { status: EmailOutboxStatus.DEAD, updatedAt: { lte: cutoffs.deliveredOutbox } },
      ],
    });
    expect(JSON.stringify(where)).not.toContain("createdAt");
  });

  it("accepts only known private attachment key namespaces", () => {
    expect(isPrivateAttachmentStorageKey("quarantine/device_photo/2026/08/id-123")).toBe(true);
    expect(isPrivateAttachmentStorageKey("clean/audiogram/id-123")).toBe(true);
    expect(isPrivateAttachmentStorageKey("catalog/2026/08/id.webp")).toBe(false);
    expect(isPrivateAttachmentStorageKey("clean/audiogram/../../other-blob")).toBe(false);
    expect(isPrivateAttachmentStorageKey("https://storage.invalid/private/blob")).toBe(false);
  });
});
