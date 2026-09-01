import type { NextRequest } from "next/server";
import { CATALOG_MEDIA_MAX_FILE_BYTES } from "@/lib/admin/catalog-media-intake";

export const CATALOG_MEDIA_MAX_REQUEST_BYTES = CATALOG_MEDIA_MAX_FILE_BYTES + 1024 * 1024;

export class CatalogMediaRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CatalogMediaRequestError";
  }
}

export function isSameOriginAdminRequest(request: NextRequest): boolean {
  const originHeader = request.headers.get("origin")?.trim();
  if (!originHeader) return false;
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") return false;

  try {
    const origin = new URL(originHeader);
    return (
      originHeader === origin.origin &&
      !origin.username &&
      !origin.password &&
      origin.origin === request.nextUrl.origin
    );
  } catch {
    return false;
  }
}

export async function readBoundedCatalogMultipartForm(
  request: NextRequest,
): Promise<FormData> {
  const contentType = request.headers.get("content-type")?.trim() || "";
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !/\bboundary=/i.test(contentType)) {
    throw new CatalogMediaRequestError("A multipart form body is required.", 415);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      throw new CatalogMediaRequestError("Content-Length is invalid.", 400);
    }
    if (declaredLength > CATALOG_MEDIA_MAX_REQUEST_BYTES) {
      throw new CatalogMediaRequestError("The upload request exceeds 9 MB.", 413);
    }
  }
  if (!request.body) {
    throw new CatalogMediaRequestError("A multipart form body is required.", 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > CATALOG_MEDIA_MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new CatalogMediaRequestError("The upload request exceeds 9 MB.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return await new Response(bytes.buffer, {
      headers: { "Content-Type": contentType },
    }).formData();
  } catch {
    throw new CatalogMediaRequestError("The multipart form body is invalid.", 400);
  }
}

export function requireSingleTextField(form: FormData, name: string): string {
  const values = form.getAll(name);
  if (values.length !== 1 || typeof values[0] !== "string") {
    throw new CatalogMediaRequestError(`The ${name} field is invalid.`, 400);
  }
  return values[0];
}

export function requireSingleFileField(form: FormData, name: string): File {
  const values = form.getAll(name);
  if (values.length !== 1 || !(values[0] instanceof File)) {
    throw new CatalogMediaRequestError("Exactly one image file is required.", 400);
  }
  return values[0];
}
