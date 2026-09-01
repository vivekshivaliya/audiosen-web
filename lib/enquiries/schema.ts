import { z } from "zod";
import { ENQUIRY_TYPES } from "@/lib/enquiries/constants";

const withoutControlCharacters = /^[^\u0000-\u001f\u007f]*$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional().or(z.literal(""));

const optionalTurnstileToken = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(20, "Complete bot verification before sending this request.").max(2048).optional(),
);

const emailSchema = z
  .string()
  .trim()
  .max(320, "Email is too long")
  .email("Enter a valid email address")
  .optional()
  .or(z.literal(""));

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is required")
  .max(30, "Phone number is too long")
  .regex(withoutControlCharacters, "Phone number contains invalid characters")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }, "Enter a valid phone or WhatsApp number");

const sourcePathSchema = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) => value.startsWith("/") && !value.startsWith("//"),
    "Source path must be a site-relative path",
  );

const preferenceValueSchema = z.union([
  z.string().trim().max(500),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().trim().max(160)).max(20),
]);

export const enquiryContextSchema = z
  .object({
    sourcePath: sourcePathSchema.optional(),
    journey: optionalText(80),
    brandSlug: z.string().trim().regex(slugPattern).max(140).optional(),
    modelSlug: z.string().trim().regex(slugPattern).max(140).optional(),
    compareSlugs: z.array(z.string().trim().regex(slugPattern).max(140)).max(3).optional(),
    preferences: z.record(z.string().max(80), preferenceValueSchema).optional(),
  })
  .optional();

export const enquiryDetailsSchema = z
  .object({
    age: z.number().int().min(0).max(120).optional(),
    selectedBrand: optionalText(120),
    selectedDevice: optionalText(160),
    hearingConcern: optionalText(1000),
    appointmentDate: z
      .string()
      .regex(datePattern, "Use YYYY-MM-DD")
      .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), "Invalid date")
      .optional(),
    appointmentTime: optionalText(80),
    homeVisit: z.boolean().optional(),
    repairBrand: optionalText(120),
    deviceModel: optionalText(160),
    problem: optionalText(2000),
    deviceAge: optionalText(80),
    warrantyStatus: optionalText(80),
    attachmentIds: z.array(z.string().uuid()).max(5).optional(),
    attachments: z
      .array(
        z.object({
          attachmentId: z.string().uuid(),
          claimToken: z.string().trim().min(32).max(200).regex(/^[A-Za-z0-9_-]+$/),
          verificationGrant: z
            .string()
            .trim()
            .min(80)
            .max(2048)
            .regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
            .optional(),
        }),
      )
      .max(5)
      .optional(),
    existingAudiogram: z.boolean().optional(),
    currentHearingAid: z.boolean().optional(),
    preferredBrand: optionalText(120),
    preferredDevice: optionalText(160),
    offerId: z.string().uuid().optional(),
    finderAnswers: z.record(z.string().max(80), preferenceValueSchema).optional(),
  })
  .optional();

export const enquiryAttributionSchema = z
  .object({
    landingPage: sourcePathSchema.optional(),
    utmSource: optionalText(200),
    utmMedium: optionalText(200),
    utmCampaign: optionalText(200),
    utmTerm: optionalText(200),
    utmContent: optionalText(200),
    gclid: optionalText(300),
    gbraid: optionalText(300),
    wbraid: optionalText(300),
    msclkid: optionalText(300),
    fbclid: optionalText(300),
  })
  .optional();

const commonFields = {
  name: z
    .string()
    .trim()
    .min(2, "Name is required")
    .max(120, "Name is too long")
    .regex(withoutControlCharacters, "Name contains invalid characters"),
  email: emailSchema,
  phone: phoneSchema,
  city: optionalText(80),
  ageGroup: optionalText(80),
  service: z.string().trim().min(2, "Service is required").max(160, "Service is too long"),
  brand: optionalText(120),
  device: optionalText(160),
  message: optionalText(4000),
  preferredChannel: optionalText(40),
  preferredCallbackTime: optionalText(80),
  source: optionalText(80),
  sourcePath: sourcePathSchema.optional(),
  landingPage: sourcePathSchema.optional(),
  context: enquiryContextSchema,
  details: enquiryDetailsSchema,
  attribution: enquiryAttributionSchema,
  turnstileToken: optionalTurnstileToken,
  consent: z.boolean().refine(Boolean, "Consent is required"),
  guardianConsent: z.boolean().optional(),
  website: z.string().trim().max(200).optional().or(z.literal("")),
};

const variant = <T extends (typeof ENQUIRY_TYPES)[number]>(type: T) =>
  z.object({ type: z.literal(type), ...commonFields });

export const enquirySchema = z.discriminatedUnion("type", [
  variant("contact"),
  variant("appointment"),
  variant("consultation"),
  variant("product_enquiry"),
  variant("request_price"),
  variant("offer"),
  variant("home_visit"),
  variant("repair"),
  variant("speech"),
  variant("finder"),
  variant("hearing_aid_finder"),
  variant("trial"),
  variant("callback"),
  variant("audiogram"),
  variant("whatsapp_lead"),
]).superRefine((input, context) => {
  if (input.type === "contact") {
    if (!input.email) {
      context.addIssue({ code: "custom", path: ["email"], message: "Email is required" });
    }
    if (!input.message?.trim()) {
      context.addIssue({ code: "custom", path: ["message"], message: "Message is required" });
    }
  }
  if (input.details?.attachmentIds?.length && !input.details.attachments?.length) {
    context.addIssue({
      code: "custom",
      path: ["details", "attachments"],
      message: "Secure attachment claim tokens are required.",
    });
  }
  if (input.details?.attachments?.length && input.type !== "repair" && input.type !== "audiogram") {
    context.addIssue({
      code: "custom",
      path: ["details", "attachments"],
      message: "Attachments are only accepted for repair or audiogram enquiries.",
    });
  }
  if (input.details?.attachments?.some((attachment) => !attachment.verificationGrant)) {
    context.addIssue({
      code: "custom",
      path: ["details", "attachments"],
      message: "A bot-verified upload grant is required for every attachment.",
    });
  }
  const ageGroup = input.ageGroup?.trim().toLowerCase();
  const isMinor =
    (input.details?.age !== undefined && input.details.age < 18) ||
    ageGroup === "child" ||
    ageGroup === "teen" ||
    input.context?.preferences?.agePath === "child";
  if (isMinor && input.guardianConsent !== true) {
    context.addIssue({
      code: "custom",
      path: ["guardianConsent"],
      message: "A parent or legal guardian must consent for a patient under 18.",
    });
  }
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(200)
  .regex(/^[A-Za-z0-9._:-]+$/, "Idempotency key contains invalid characters");
