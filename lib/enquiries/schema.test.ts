import { describe, expect, it } from "vitest";
import { enquirySchema } from "@/lib/enquiries/schema";

const base = {
  name: "Test Patient",
  email: "patient@example.com",
  phone: "8923092563",
  city: "Dehradun",
  service: "Hearing care consultation",
  message: "Please contact me about a hearing care consultation.",
  consent: true,
  website: "",
};
const verificationGrant = `${"a".repeat(96)}.${"b".repeat(43)}`;

describe("enquirySchema", () => {
  it.each([
    "contact", "appointment", "product_enquiry", "request_price", "offer", "home_visit",
    "repair", "speech", "finder", "trial", "callback", "audiogram", "whatsapp_lead",
  ] as const)("accepts canonical %s enquiries", (type) => {
    expect(enquirySchema.safeParse({ ...base, type }).success).toBe(true);
  });

  it.each(["consultation", "hearing_aid_finder"] as const)(
    "keeps the %s compatibility alias",
    (type) => expect(enquirySchema.safeParse({ ...base, type }).success).toBe(true),
  );

  it("treats an empty optional Turnstile token as absent", () => {
    const result = enquirySchema.safeParse({ ...base, type: "home_visit", turnstileToken: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.turnstileToken).toBeUndefined();
  });

  it("requires secure claim tokens for attachment IDs", () => {
    const result = enquirySchema.safeParse({
      ...base,
      type: "repair",
      details: { attachmentIds: ["151265f0-0642-4a7a-8960-9f8cda810f5d"] },
    });
    expect(result.success).toBe(false);
  });

  it("accepts staged repair attachment claims", () => {
    const result = enquirySchema.safeParse({
      ...base,
      type: "repair",
      details: {
        attachments: [
          {
            attachmentId: "151265f0-0642-4a7a-8960-9f8cda810f5d",
            claimToken: "a_secure_base64url_claim_token_1234567890",
            verificationGrant,
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an attachment claim without its bot-verified upload grant", () => {
    const result = enquirySchema.safeParse({
      ...base,
      type: "audiogram",
      details: {
        attachments: [
          {
            attachmentId: "151265f0-0642-4a7a-8960-9f8cda810f5d",
            claimToken: "a_secure_base64url_claim_token_1234567890",
          },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing consent and subject control characters", () => {
    expect(enquirySchema.safeParse({ ...base, type: "contact", consent: false }).success).toBe(false);
    expect(enquirySchema.safeParse({ ...base, type: "contact", name: "Header\r\nInjection" }).success).toBe(false);
  });

  it("requires explicit guardian consent for declared minor age groups", () => {
    expect(
      enquirySchema.safeParse({ ...base, type: "consultation", ageGroup: "teen" }).success,
    ).toBe(false);
    expect(
      enquirySchema.safeParse({
        ...base,
        type: "consultation",
        ageGroup: "teen",
        guardianConsent: true,
      }).success,
    ).toBe(true);
  });

  it("enforces guardian consent on the pediatric finder diversion", () => {
    const pediatricFinder = {
      ...base,
      type: "finder" as const,
      context: { preferences: { agePath: "child" } },
    };
    expect(enquirySchema.safeParse(pediatricFinder).success).toBe(false);
    expect(
      enquirySchema.safeParse({ ...pediatricFinder, guardianConsent: true }).success,
    ).toBe(true);
  });
});
