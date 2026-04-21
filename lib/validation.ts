import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120, "Name too long"),
  email: z.string().trim().email("Valid email required"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone too long")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Message is too short")
    .max(4000, "Message is too long"),
  website: z.string().trim().optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const paymentOrderSchema = z.object({
  planId: z.enum(["six_months", "one_year"]),
});

export const paymentVerifySchema = z.object({
  planId: z.enum(["six_months", "one_year"]),
  razorpayOrderId: z
    .string()
    .trim()
    .min(8, "Invalid order id")
    .max(120, "Invalid order id"),
  razorpayPaymentId: z
    .string()
    .trim()
    .min(8, "Invalid payment id")
    .max(120, "Invalid payment id"),
  razorpaySignature: z
    .string()
    .trim()
    .min(8, "Invalid signature")
    .max(200, "Invalid signature"),
});
