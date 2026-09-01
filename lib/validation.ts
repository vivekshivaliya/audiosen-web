import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120, "Name too long"),
  email: z
    .string()
    .trim()
    .email("Valid email required")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number is required")
    .max(30, "Phone too long")
    .refine(
      (value) => {
        const digitCount = value.replace(/\D/g, "").length;
        return digitCount >= 7 && digitCount <= 15;
      },
      "Enter a valid phone or WhatsApp number",
    ),
  city: z.string().trim().max(80, "City too long").optional().or(z.literal("")),
  language: z.string().trim().max(40, "Language too long").optional().or(z.literal("")),
  serviceNeeded: z
    .string()
    .trim()
    .min(2, "Please select how we can help")
    .max(120, "Service value too long"),
  preferredChannel: z
    .string()
    .trim()
    .max(40, "Preferred channel value too long")
    .optional()
    .or(z.literal("")),
  preferredCallbackTime: z
    .string()
    .trim()
    .max(60, "Preferred callback time value too long")
    .optional()
    .or(z.literal("")),
  leadSource: z
    .string()
    .trim()
    .max(60, "Lead source value too long")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().min(2, "Message is required").max(4000, "Message is too long"),
  consent: z.boolean().refine((value) => value, {
    message: "Please consent to being contacted about this request",
  }),
  landingPage: z.string().trim().max(500, "Landing page value too long").optional().or(z.literal("")),
  sourcePage: z.string().trim().max(500, "Source page value too long").optional().or(z.literal("")),
  utmSource: z.string().trim().max(200, "UTM source value too long").optional().or(z.literal("")),
  utmMedium: z.string().trim().max(200, "UTM medium value too long").optional().or(z.literal("")),
  utmCampaign: z.string().trim().max(200, "UTM campaign value too long").optional().or(z.literal("")),
  utmTerm: z.string().trim().max(200, "UTM term value too long").optional().or(z.literal("")),
  utmContent: z.string().trim().max(200, "UTM content value too long").optional().or(z.literal("")),
  gclid: z.string().trim().max(300, "Google click ID too long").optional().or(z.literal("")),
  gbraid: z.string().trim().max(300, "Google braid value too long").optional().or(z.literal("")),
  wbraid: z.string().trim().max(300, "Google braid value too long").optional().or(z.literal("")),
  msclkid: z.string().trim().max(300, "Microsoft click ID too long").optional().or(z.literal("")),
  fbclid: z.string().trim().max(300, "Meta click ID too long").optional().or(z.literal("")),
  turnstileToken: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(20, "Complete bot verification before sending this request.").max(2048).optional(),
  ),
  website: z.string().trim().optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;
