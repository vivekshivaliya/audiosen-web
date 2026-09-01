import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { DefaultAzureCredential } from "@azure/identity";

type StoredToken = { reference: string; keyVersion: string };

function keyVaultUrl(): URL | null {
  const value = process.env.GOOGLE_BUSINESS_KEY_VAULT_URL?.trim();
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".vault.azure.net")) {
    throw new Error("Google Business Key Vault URL is invalid.");
  }
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

async function keyVaultBearerToken(): Promise<string> {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken("https://vault.azure.net/.default");
  if (!token?.token) throw new Error("Key Vault managed identity is unavailable.");
  return token.token;
}

function localKey(): Buffer {
  const encoded = process.env.GOOGLE_BUSINESS_TOKEN_KEY?.trim();
  const key = encoded ? Buffer.from(encoded, "base64") : Buffer.alloc(0);
  if (key.length !== 32) {
    throw new Error("A 32-byte GOOGLE_BUSINESS_TOKEN_KEY is required for local development.");
  }
  return key;
}

function encryptLocal(value: string): StoredToken {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", localKey(), nonce);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    reference: `local:v1:${nonce.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`,
    keyVersion: "local-aes-256-gcm-v1",
  };
}

function decryptLocal(reference: string): string {
  const [namespace, version, nonceValue, tagValue, cipherValue] = reference.split(":");
  if (namespace !== "local" || version !== "v1" || !nonceValue || !tagValue || !cipherValue) {
    throw new Error("Stored Google Business token reference is invalid.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    localKey(),
    Buffer.from(nonceValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(cipherValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function storeGoogleBusinessRefreshToken(
  connectionId: string,
  refreshToken: string,
): Promise<StoredToken> {
  const vault = keyVaultUrl();
  if (!vault) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Google Business Key Vault is required in production.");
    }
    return encryptLocal(refreshToken);
  }

  const secretName = `audiosen-gbp-${connectionId.replaceAll("-", "")}`;
  const endpoint = new URL(`secrets/${secretName}`, vault);
  endpoint.searchParams.set("api-version", "7.5");
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${await keyVaultBearerToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ value: refreshToken, attributes: { enabled: true } }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Google Business token could not be stored in Key Vault.");
  const stored = (await response.json()) as { id?: string };
  if (!stored.id || !stored.id.startsWith(vault.toString())) {
    throw new Error("Key Vault returned an invalid token reference.");
  }
  return { reference: `keyvault:${stored.id}`, keyVersion: "azure-key-vault-secret-v1" };
}

export async function readGoogleBusinessRefreshToken(reference: string): Promise<string> {
  if (reference.startsWith("local:")) {
    if (process.env.NODE_ENV === "production") throw new Error("Local token storage is disabled.");
    return decryptLocal(reference);
  }
  if (!reference.startsWith("keyvault:")) {
    throw new Error("Stored Google Business token reference is invalid.");
  }
  const vault = keyVaultUrl();
  if (!vault) throw new Error("Google Business Key Vault is unavailable.");
  const secretUrl = new URL(reference.slice("keyvault:".length));
  if (
    secretUrl.protocol !== "https:" ||
    secretUrl.hostname !== vault.hostname ||
    !secretUrl.pathname.startsWith("/secrets/audiosen-gbp-")
  ) {
    throw new Error("Stored Google Business Key Vault reference is invalid.");
  }
  secretUrl.searchParams.set("api-version", "7.5");
  const response = await fetch(secretUrl, {
    headers: {
      Authorization: `Bearer ${await keyVaultBearerToken()}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("Google Business token could not be read from Key Vault.");
  const stored = (await response.json()) as { value?: string };
  if (!stored.value) throw new Error("Google Business token is missing from Key Vault.");
  return stored.value;
}
