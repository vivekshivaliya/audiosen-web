import { describe, expect, it } from "vitest";
import { detectUploadMimeType } from "@/lib/uploads/intake";

describe("upload magic-byte detection", () => {
  it("recognizes the permitted file signatures", () => {
    expect(detectUploadMimeType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg");
    expect(
      detectUploadMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("image/png");
    expect(detectUploadMimeType(new TextEncoder().encode("%PDF-1.7"))).toBe("application/pdf");
    expect(detectUploadMimeType(new TextEncoder().encode("RIFF0000WEBP"))).toBe("image/webp");
  });

  it("does not trust arbitrary content", () => {
    expect(detectUploadMimeType(new TextEncoder().encode("not an image"))).toBeUndefined();
  });
});
