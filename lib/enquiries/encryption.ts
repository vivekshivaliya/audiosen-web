import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EncryptedPayload = {
  ciphertext: string;
  nonce: string;
  authTag: string;
  keyVersion: string;
};

export class EnquiryEncryptionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnquiryEncryptionConfigurationError";
  }
}

function configuredKeys(): { activeVersion: string; keys: Map<string, Buffer> } {
  const activeVersion = process.env.ENQUIRY_FIELD_ENCRYPTION_KEY_VERSION?.trim() || "v1";
  const keyMap = new Map<string, Buffer>();
  const keyRing = process.env.ENQUIRY_FIELD_ENCRYPTION_KEYS?.trim();

  if (keyRing) {
    try {
      const parsed = JSON.parse(keyRing) as Record<string, unknown>;
      for (const [version, encoded] of Object.entries(parsed)) {
        if (typeof encoded !== "string") continue;
        const key = Buffer.from(encoded, "base64");
        if (key.length === 32) keyMap.set(version, key);
      }
    } catch {
      throw new EnquiryEncryptionConfigurationError(
        "ENQUIRY_FIELD_ENCRYPTION_KEYS must be a JSON object of base64-encoded 32-byte keys.",
      );
    }
  }

  const singleKey = process.env.ENQUIRY_FIELD_ENCRYPTION_KEY?.trim();
  if (singleKey) {
    const key = Buffer.from(singleKey, "base64");
    if (key.length !== 32) {
      throw new EnquiryEncryptionConfigurationError(
        "ENQUIRY_FIELD_ENCRYPTION_KEY must be a base64-encoded 32-byte key.",
      );
    }
    keyMap.set(activeVersion, key);
  }

  if (keyMap.size === 0 && process.env.NODE_ENV !== "production") {
    keyMap.set(
      "local-development-only",
      createHash("sha256").update("audiosen-local-enquiry-encryption-only").digest(),
    );
    return { activeVersion: "local-development-only", keys: keyMap };
  }

  if (!keyMap.has(activeVersion)) {
    throw new EnquiryEncryptionConfigurationError(
      `No enquiry encryption key is configured for active version ${activeVersion}.`,
    );
  }
  return { activeVersion, keys: keyMap };
}

export function encryptEnquiryPayload(value: unknown): EncryptedPayload {
  const { activeVersion, keys } = configuredKeys();
  const key = keys.get(activeVersion);
  if (!key) throw new EnquiryEncryptionConfigurationError("Active encryption key is unavailable.");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(`audiosen-enquiry:${activeVersion}`, "utf8"));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString("base64"),
    nonce: nonce.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    keyVersion: activeVersion,
  };
}

export function decryptEnquiryPayload<T>(payload: EncryptedPayload): T {
  const { keys } = configuredKeys();
  const key = keys.get(payload.keyVersion);
  if (!key) {
    throw new EnquiryEncryptionConfigurationError(
      `No enquiry decryption key is available for version ${payload.keyVersion}.`,
    );
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.nonce, "base64"),
  );
  decipher.setAAD(Buffer.from(`audiosen-enquiry:${payload.keyVersion}`, "utf8"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as T;
}
