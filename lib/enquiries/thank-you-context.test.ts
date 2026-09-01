import { afterEach, describe, expect, it } from "vitest";
import {
  createThankYouContextToken,
  verifyThankYouContextToken,
} from "@/lib/enquiries/thank-you-context";

const previousSecret = process.env.THANK_YOU_CONTEXT_SECRET;

afterEach(() => {
  process.env.THANK_YOU_CONTEXT_SECRET = previousSecret;
});

describe("thank-you context", () => {
  it("signs and verifies non-PII success context", () => {
    process.env.THANK_YOU_CONTEXT_SECRET = "test-secret-that-is-not-used-in-production";
    const token = createThankYouContextToken({
      reference: "AUD-20260822-ABCDEFGH",
      service: "Hearing aid consultation",
      selectedDevice: "Example device",
    });
    expect(verifyThankYouContextToken(token)).toMatchObject({
      reference: "AUD-20260822-ABCDEFGH",
      service: "Hearing aid consultation",
      selectedDevice: "Example device",
    });
  });

  it("rejects a modified token", () => {
    process.env.THANK_YOU_CONTEXT_SECRET = "test-secret-that-is-not-used-in-production";
    const token = createThankYouContextToken({
      reference: "AUD-20260822-ABCDEFGH",
      service: "Consultation",
    });
    expect(verifyThankYouContextToken(`${token}x`)).toBeNull();
  });
});
