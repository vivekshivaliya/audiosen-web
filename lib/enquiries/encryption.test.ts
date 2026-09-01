import { afterEach, describe, expect, it } from "vitest";
import { decryptEnquiryPayload, encryptEnquiryPayload } from "@/lib/enquiries/encryption";

const previousKey = process.env.ENQUIRY_FIELD_ENCRYPTION_KEY;
const previousVersion = process.env.ENQUIRY_FIELD_ENCRYPTION_KEY_VERSION;
const previousRing = process.env.ENQUIRY_FIELD_ENCRYPTION_KEYS;

afterEach(() => {
  process.env.ENQUIRY_FIELD_ENCRYPTION_KEY = previousKey;
  process.env.ENQUIRY_FIELD_ENCRYPTION_KEY_VERSION = previousVersion;
  process.env.ENQUIRY_FIELD_ENCRYPTION_KEYS = previousRing;
});

describe("enquiry field encryption", () => {
  it("round-trips an authenticated AES-256-GCM envelope", () => {
    process.env.ENQUIRY_FIELD_ENCRYPTION_KEY_VERSION = "test-v1";
    process.env.ENQUIRY_FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    delete process.env.ENQUIRY_FIELD_ENCRYPTION_KEYS;
    const encrypted = encryptEnquiryPayload({ message: "private narrative" });
    expect(encrypted.ciphertext).not.toContain("private narrative");
    expect(encrypted.keyVersion).toBe("test-v1");
    expect(decryptEnquiryPayload(encrypted)).toEqual({ message: "private narrative" });
  });

  it("rejects tampered authentication tags", () => {
    process.env.ENQUIRY_FIELD_ENCRYPTION_KEY_VERSION = "test-v1";
    process.env.ENQUIRY_FIELD_ENCRYPTION_KEY = Buffer.alloc(32, 8).toString("base64");
    delete process.env.ENQUIRY_FIELD_ENCRYPTION_KEYS;
    const encrypted = encryptEnquiryPayload({ message: "private narrative" });
    const tag = Buffer.from(encrypted.authTag, "base64");
    tag[0] ^= 0xff;
    expect(() =>
      decryptEnquiryPayload({ ...encrypted, authTag: tag.toString("base64") }),
    ).toThrow();
  });
});
