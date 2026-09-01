import { getApprovedCatalogMediaAsset } from "@/lib/catalog/approved-snapshot";
import {
  buildCatalogBlobUrl,
  catalogMediaFetchTimeoutMs,
  catalogMediaResponseLimitBytes,
  hasExpectedCatalogMediaMagic,
  parseCatalogPublicMediaBaseUrl,
} from "@/lib/catalog/public-media";

type RouteContext = { params: Promise<{ id: string }> };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function withheld(): Response {
  return new Response(null, {
    status: 404,
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

async function readBoundedBody(
  response: Response,
  controller: AbortController,
): Promise<Uint8Array | null> {
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > catalogMediaResponseLimitBytes) {
      controller.abort();
      return null;
    }
    chunks.push(value);
  }
  if (size === 0) return null;
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function settleBeforeAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T | null> {
  if (signal.aborted) return null;
  return new Promise((resolve) => {
    const onAbort = () => resolve(null);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      () => {
        signal.removeEventListener("abort", onAbort);
        resolve(null);
      },
    );
  });
}

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const { id } = await params;
  if (!uuidPattern.test(id)) return withheld();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), catalogMediaFetchTimeoutMs);
  try {
    const baseUrl = parseCatalogPublicMediaBaseUrl(process.env.CATALOG_PUBLIC_MEDIA_BASE_URL);
    const asset = await settleBeforeAbort(getApprovedCatalogMediaAsset(id), controller.signal);
    if (!asset || !baseUrl) return withheld();

    const blobUrl = buildCatalogBlobUrl(baseUrl, asset.storageKey);
    if (!blobUrl) return withheld();

    const upstream = await fetch(blobUrl, {
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      headers: { Accept: asset.contentType },
    });
    if (!upstream.ok || upstream.redirected || upstream.status !== 200) return withheld();

    const contentType = upstream.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== asset.contentType) return withheld();

    const declaredLengthHeader = upstream.headers.get("content-length");
    const declaredLength = declaredLengthHeader ? Number(declaredLengthHeader) : null;
    if (
      declaredLength !== null &&
      (!Number.isFinite(declaredLength) ||
        declaredLength <= 0 ||
        declaredLength > catalogMediaResponseLimitBytes)
    ) {
      return withheld();
    }

    const bytes = await readBoundedBody(upstream, controller);
    if (!bytes || !hasExpectedCatalogMediaMagic(bytes, asset.contentType)) return withheld();

    const responseBody = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    return new Response(responseBody, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300, must-revalidate",
        "Content-Length": String(bytes.byteLength),
        "Content-Type": asset.contentType,
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return withheld();
  } finally {
    clearTimeout(timeout);
  }
}
