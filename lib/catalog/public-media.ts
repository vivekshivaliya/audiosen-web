const maximumCatalogMediaBytes = 5 * 1024 * 1024;

export const catalogMediaResponseLimitBytes = maximumCatalogMediaBytes;
export const catalogMediaFetchTimeoutMs = 5_000;

export function parseCatalogPublicMediaBaseUrl(value: string | undefined): URL | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/`;
    return url;
  } catch {
    return null;
  }
}

export function buildCatalogBlobUrl(baseUrl: URL, storageKey: string): URL | null {
  if (
    !storageKey ||
    storageKey !== storageKey.trim() ||
    storageKey.startsWith("/") ||
    storageKey.includes("\\") ||
    storageKey.split("/").some((segment) => !segment || segment === "." || segment === "..") ||
    /^https?:\/\//i.test(storageKey)
  ) {
    return null;
  }
  const encodedKey = storageKey.split("/").map(encodeURIComponent).join("/");
  return new URL(encodedKey, baseUrl);
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function hasExpectedCatalogMediaMagic(
  bytes: Uint8Array,
  contentType: "image/webp" | "image/avif",
): boolean {
  if (bytes.byteLength < 12 || bytes.byteLength > maximumCatalogMediaBytes) return false;
  if (contentType === "image/webp") {
    return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
  }
  if (ascii(bytes, 4, 4) !== "ftyp") return false;
  const brandBytes = bytes.slice(8, Math.min(bytes.byteLength, 64));
  for (let offset = 0; offset + 4 <= brandBytes.byteLength; offset += 4) {
    const brand = ascii(brandBytes, offset, 4);
    if (brand === "avif" || brand === "avis") return true;
  }
  return false;
}
