import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleUploadIntake } from "@/app/api/uploads/intake/route";
import { UploadGrantConfigurationError } from "@/lib/uploads/verification-grant";

function request() {
  return new NextRequest("http://localhost/api/uploads/intake", {
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data; boundary=audiosen-test",
      Origin: "http://localhost:3000",
      "User-Agent": "Audiosen upload route test",
      "X-Audiosen-Turnstile-Token": "turnstile-test-token-long-enough",
    },
    body: "--audiosen-test--\r\n",
  });
}

describe("private upload intake authorization order", () => {
  beforeEach(() => vi.stubEnv("PUBLIC_ENQUIRIES_ENABLED", "true"));
  afterEach(() => vi.unstubAllEnvs());

  it("does not accept bytes while public enquiries are disabled", async () => {
    vi.stubEnv("PUBLIC_ENQUIRIES_ENABLED", "false");
    const readForm = vi.fn(async () => new FormData());
    const response = await handleUploadIntake(request(), {
      assertGrantConfigured: vi.fn(),
      verifyBot: vi.fn(async () => ({ ok: true as const })),
      readForm,
      storeUpload: vi.fn(),
    });

    expect(response.status).toBe(503);
    expect(readForm).not.toHaveBeenCalled();
  });

  it("does not parse or store multipart bytes when Turnstile rejects the request", async () => {
    const readForm = vi.fn(async () => new FormData());
    const storeUpload = vi.fn();
    const response = await handleUploadIntake(request(), {
      assertGrantConfigured: vi.fn(),
      verifyBot: vi.fn(async () => ({ ok: false as const, code: "VERIFICATION_FAILED" as const })),
      readForm,
      storeUpload,
    });

    expect(response.status).toBe(400);
    expect(readForm).not.toHaveBeenCalled();
    expect(storeUpload).not.toHaveBeenCalled();
  });

  it("fails before verification or body parsing when grant signing is unavailable", async () => {
    const verifyBot = vi.fn(async () => ({ ok: true as const }));
    const readForm = vi.fn(async () => new FormData());
    const response = await handleUploadIntake(request(), {
      assertGrantConfigured: () => {
        throw new UploadGrantConfigurationError();
      },
      verifyBot,
      readForm,
      storeUpload: vi.fn(),
    });

    expect(response.status).toBe(503);
    expect(verifyBot).not.toHaveBeenCalled();
    expect(readForm).not.toHaveBeenCalled();
  });

  it("authorizes before parsing and stores only after parsing succeeds", async () => {
    const calls: string[] = [];
    const form = new FormData();
    form.set("purpose", "device_photo");
    form.set("file", new File([Uint8Array.from([0xff, 0xd8, 0xff])], "device.jpg", {
      type: "image/jpeg",
    }));
    const response = await handleUploadIntake(request(), {
      assertGrantConfigured: () => calls.push("configured"),
      verifyBot: async () => {
        calls.push("verified");
        return { ok: true };
      },
      readForm: async () => {
        calls.push("parsed");
        return form;
      },
      storeUpload: async () => {
        calls.push("stored");
        return {
          attachmentId: "151265f0-0642-4a7a-8960-9f8cda810f5d",
          claimToken: "a_secure_base64url_claim_token_1234567890",
          verificationGrant: "signed.grant",
          purpose: "device_photo",
          status: "quarantined" as const,
          expiresAt: "2026-08-22T12:30:00.000Z",
        };
      },
    });

    expect(response.status).toBe(201);
    expect(calls).toEqual(["configured", "verified", "parsed", "stored"]);
  });
});
