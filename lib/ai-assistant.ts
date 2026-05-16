import { z } from "zod";

export const aiAssistantActionSchema = z.object({
  label: z.string().trim().min(2).max(42),
  message: z.string().trim().min(2).max(220),
  type: z.enum(["ask", "book", "call"]),
});

export const aiAssistantResponseSchema = z.object({
  reply: z.string().trim().min(1).max(1600),
  suggestedActions: z.array(aiAssistantActionSchema).max(3),
  contactPrefill: z.string().trim().max(1800).nullable(),
});

export const aiAssistantMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(900),
});

export const aiAssistantHearingSummarySchema = z.object({
  completedAt: z.string().trim().max(80),
  leftPta: z.union([z.number(), z.literal("N/A")]),
  rightPta: z.union([z.number(), z.literal("N/A")]),
  leftSeverity: z.string().trim().max(80),
  rightSeverity: z.string().trim().max(80),
  reliability: z.enum(["good", "fair", "low"]),
  reliabilityLabel: z.string().trim().max(120),
  recommendation: z.string().trim().max(400),
  notes: z.array(z.string().trim().max(240)).max(5),
});

export const aiAssistantRequestSchema = z.object({
  messages: z.array(aiAssistantMessageSchema).min(1).max(8),
  currentPath: z.string().trim().min(1).max(160),
  hearingSummary: aiAssistantHearingSummarySchema.nullable().optional(),
});

export type AiAssistantAction = z.infer<typeof aiAssistantActionSchema>;
export type AiAssistantMessage = z.infer<typeof aiAssistantMessageSchema>;
export type AiAssistantResponse = z.infer<typeof aiAssistantResponseSchema>;
export type AiAssistantRequest = z.infer<typeof aiAssistantRequestSchema>;
