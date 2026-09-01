import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  CATALOG_MEDIA_MAX_REQUEST_BYTES,
  CatalogMediaRequestError,
  isSameOriginAdminRequest,
  readBoundedCatalogMultipartForm,
  requireSingleFileField,
  requireSingleTextField,
} from "@/lib/admin/catalog-media-http";

describe("catalog media admin HTTP policy", () => {
  it("requires an exact same-origin POST context", () => {
    const sameOrigin = new NextRequest("https://audiosen.com/api/admin/catalog/media", {
      method: "POST",
      headers: {
        origin: "https://audiosen.com",
        "sec-fetch-site": "same-origin",
      },
    });
    const crossOrigin = new NextRequest("https://audiosen.com/api/admin/catalog/media", {
      method: "POST",
      headers: {
        origin: "https://attacker.example",
        "sec-fetch-site": "cross-site",
      },
    });
    const missingOrigin = new NextRequest("https://audiosen.com/api/admin/catalog/media", {
      method: "POST",
    });

    expect(isSameOriginAdminRequest(sameOrigin)).toBe(true);
    expect(isSameOriginAdminRequest(crossOrigin)).toBe(false);
    expect(isSameOriginAdminRequest(missingOrigin)).toBe(false);
  });

  it("rejects a declared multipart body above the bounded request limit", async () => {
    const request = new NextRequest("https://audiosen.com/api/admin/catalog/media", {
      method: "POST",
      body: "x",
      headers: {
        "content-length": String(CATALOG_MEDIA_MAX_REQUEST_BYTES + 1),
        "content-type": "multipart/form-data; boundary=test",
      },
    });

    await expect(readBoundedCatalogMultipartForm(request)).rejects.toMatchObject({
      status: 413,
    } satisfies Partial<CatalogMediaRequestError>);
  });

  it("parses one bounded file and rejects duplicate scalar fields", async () => {
    const form = new FormData();
    form.append("altText", "First description");
    form.append("file", new File([new Uint8Array([1, 2, 3])], "image.jpg", {
      type: "image/jpeg",
    }));
    const request = new NextRequest("https://audiosen.com/api/admin/catalog/media", {
      method: "POST",
      body: form,
    });
    const parsed = await readBoundedCatalogMultipartForm(request);

    expect(requireSingleTextField(parsed, "altText")).toBe("First description");
    expect(requireSingleFileField(parsed, "file").name).toBe("image.jpg");
    parsed.append("altText", "Second description");
    expect(() => requireSingleTextField(parsed, "altText")).toThrow(CatalogMediaRequestError);
  });
});
