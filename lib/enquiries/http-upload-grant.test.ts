import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createUploadVerificationGrant } from "@/lib/uploads/verification-grant";

const mocks = vi.hoisted(() => ({
  verifyTurnstile: vi.fn(),
  saveEnquiry: vi.fn(),
}));

vi.mock("@/lib/enquiries/turnstile", () => ({
  verifyTurnstile: mocks.verifyTurnstile,
}));

vi.mock("@/lib/enquiries/persistence", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/enquiries/persistence")>();
  return { ...original, saveEnquiryWithOutbox: mocks.saveEnquiry };
});

import { handleEnquiryPost } from "@/lib/enquiries/http";

const secret = "test-only-upload-grant-secret-with-more-than-32-bytes";
const attachmentId = "151265f0-0642-4a7a-8960-9f8cda810f5d";
const claimToken = "a_secure_base64url_claim_token_1234567890";
const userAgent = "Audiosen enquiry grant test";

describe("enquiry upload bot grant", () => {
  beforeEach(() => {
    vi.stubEnv("UPLOAD_VERIFICATION_GRANT_SECRET", secret);
    vi.stubEnv("PUBLIC_ENQUIRIES_ENABLED", "true");
    mocks.verifyTurnstile.mockReset();
    mocks.saveEnquiry.mockReset();
    mocks.saveEnquiry.mockResolvedValue({
      reference: "AUD-20260822-ABCDEFGH",
      service: "Hearing aid repair",
      deduplicated: false,
      backend: "postgresql",
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("accepts a matching upload grant without reusing Turnstile and strips both bot credentials", async () => {
    const verificationGrant = createUploadVerificationGrant({
      attachmentId,
      claimToken,
      purpose: "device_photo",
      expiresAt: new Date(Date.now() + 30 * 60_000),
      ip: "unknown",
      userAgent,
    });
    const request = new NextRequest("http://localhost/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        "User-Agent": userAgent,
        "Idempotency-Key": "upload-grant-test-1",
      },
      body: JSON.stringify({
        type: "repair",
        name: "Test Patient",
        phone: "8923092563",
        city: "Dehradun",
        service: "Hearing aid repair",
        consent: true,
        website: "",
        details: {
          attachments: [{ attachmentId, claimToken, verificationGrant }],
        },
      }),
    });

    const response = await handleEnquiryPost(request);
    expect(response.status).toBe(201);
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.saveEnquiry).toHaveBeenCalledOnce();
    const persisted = mocks.saveEnquiry.mock.calls[0][0];
    expect(persisted.turnstileToken).toBeUndefined();
    expect(persisted.details?.attachments).toEqual([{ attachmentId, claimToken }]);
    expect(JSON.stringify(persisted)).not.toContain(verificationGrant);
  });
});
