import { describe, expect, it } from "vitest";
import {
  buildCatalogBlobUrl,
  hasExpectedCatalogMediaMagic,
  parseCatalogPublicMediaBaseUrl,
} from "@/lib/catalog/public-media";

describe("approved catalog public media", () => {
  it("accepts only an HTTPS base without credentials, query, or fragment", () => {
    expect(parseCatalogPublicMediaBaseUrl("https://cdn.example/catalog")?.href).toBe(
      "https://cdn.example/catalog/",
    );
    expect(parseCatalogPublicMediaBaseUrl("http://cdn.example/catalog")).toBeNull();
    expect(parseCatalogPublicMediaBaseUrl("https://user@cdn.example/catalog")).toBeNull();
    expect(parseCatalogPublicMediaBaseUrl("https://cdn.example/catalog?token=secret")).toBeNull();
  });

  it("encodes a safe relative key and rejects path or URL escapes", () => {
    const base = new URL("https://cdn.example/catalog/");
    expect(buildCatalogBlobUrl(base, "catalog/phonak/model one.webp")?.href).toBe(
      "https://cdn.example/catalog/catalog/phonak/model%20one.webp",
    );
    expect(buildCatalogBlobUrl(base, "../private/model.webp")).toBeNull();
    expect(buildCatalogBlobUrl(base, "/catalog/model.webp")).toBeNull();
    expect(buildCatalogBlobUrl(base, "https://attacker.example/model.webp")).toBeNull();
  });

  it("requires exact WebP or AVIF magic for the declared MIME", () => {
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
    ]);
    const avif = new Uint8Array([
      0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66,
    ]);
    expect(hasExpectedCatalogMediaMagic(webp, "image/webp")).toBe(true);
    expect(hasExpectedCatalogMediaMagic(webp, "image/avif")).toBe(false);
    expect(hasExpectedCatalogMediaMagic(avif, "image/avif")).toBe(true);
    expect(hasExpectedCatalogMediaMagic(avif, "image/webp")).toBe(false);
  });
});
