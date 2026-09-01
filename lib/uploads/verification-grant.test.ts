import { describe, expect, it } from "vitest";
import {
  createUploadVerificationGrant,
  UploadGrantConfigurationError,
  verifyUploadVerificationGrant,
} from "@/lib/uploads/verification-grant";

const secret = "test-only-upload-grant-secret-with-more-than-32-bytes";
const now = new Date("2026-08-22T12:00:00.000Z");
const attachmentId = "151265f0-0642-4a7a-8960-9f8cda810f5d";
const claimToken = "a_secure_base64url_claim_token_1234567890";
const client = { ip: "203.0.113.8", userAgent: "Audiosen grant test" };

function grant() {
  return createUploadVerificationGrant(
    {
      attachmentId,
      claimToken,
      purpose: "device_photo",
      expiresAt: new Date(now.getTime() + 30 * 60_000),
      ...client,
    },
    { secret, now },
  );
}

describe("upload verification grants", () => {
  it("accepts an authentic, unexpired, attachment-bound grant for the same client", () => {
    expect(
      verifyUploadVerificationGrant(
        {
          grant: grant(),
          attachmentId,
          claimToken,
          purpose: "device_photo",
          ...client,
        },
        { secret, now: new Date(now.getTime() + 60_000) },
      ),
    ).toEqual({ ok: true });
  });

  it.each([
    ["attachment", { attachmentId: "251265f0-0642-4a7a-8960-9f8cda810f5d" }],
    ["claim", { claimToken: "another_secure_base64url_claim_token_12345" }],
    ["purpose", { purpose: "audiogram" as const }],
  ])("rejects a grant rebound to another %s", (_label, replacement) => {
    expect(
      verifyUploadVerificationGrant(
        {
          grant: grant(),
          attachmentId,
          claimToken,
          purpose: "device_photo",
          ...client,
          ...replacement,
        },
        { secret, now: new Date(now.getTime() + 60_000) },
      ),
    ).toEqual({ ok: false, code: "INVALID" });
  });

  it("binds the grant to the trusted client address and user agent", () => {
    expect(
      verifyUploadVerificationGrant(
        {
          grant: grant(),
          attachmentId,
          claimToken,
          purpose: "device_photo",
          ip: "203.0.113.99",
          userAgent: client.userAgent,
        },
        { secret, now: new Date(now.getTime() + 60_000) },
      ),
    ).toEqual({ ok: false, code: "CLIENT_MISMATCH" });
  });

  it("rejects expired and tampered grants", () => {
    expect(
      verifyUploadVerificationGrant(
        {
          grant: grant(),
          attachmentId,
          claimToken,
          purpose: "device_photo",
          ...client,
        },
        { secret, now: new Date(now.getTime() + 30 * 60_000) },
      ),
    ).toEqual({ ok: false, code: "EXPIRED" });

    const original = grant();
    const tampered = `${original.slice(0, -1)}${original.endsWith("A") ? "B" : "A"}`;
    expect(
      verifyUploadVerificationGrant(
        {
          grant: tampered,
          attachmentId,
          claimToken,
          purpose: "device_photo",
          ...client,
        },
        { secret, now },
      ),
    ).toEqual({ ok: false, code: "INVALID" });
  });

  it("fails closed without a high-entropy signing secret", () => {
    expect(() =>
      createUploadVerificationGrant(
        {
          attachmentId,
          claimToken,
          purpose: "device_photo",
          expiresAt: new Date(now.getTime() + 60_000),
          ...client,
        },
        { secret: "too-short", now },
      ),
    ).toThrow(UploadGrantConfigurationError);

    expect(
      verifyUploadVerificationGrant(
        {
          grant: grant(),
          attachmentId,
          claimToken,
          purpose: "device_photo",
          ...client,
        },
        { secret: "too-short", now },
      ),
    ).toEqual({ ok: false, code: "NOT_CONFIGURED" });
  });
});
