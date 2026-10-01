import { z } from "zod";

export const supportCategories = { correction: "Data correction", general: "General question", privacy: "Privacy request", rights: "Image rights", accessibility: "Accessibility problem" } as const;
export const supportStatuses = { new: "New", reviewing: "In review", resolved: "Resolved", spam: "Spam" } as const;
const optionalUrl = z.union([z.literal(""), z.url().max(1000).refine(value => /^https?:\/\//i.test(value), "Use an HTTP or HTTPS link.")]).default("");
export const supportSubmission = z.object({
  category: z.enum(["correction", "general", "privacy", "rights", "accessibility"]),
  name: z.string().trim().max(100).default(""),
  email: z.union([z.literal(""), z.email().max(254)]).default(""),
  page: z.string().trim().max(300).default(""),
  source: optionalUrl,
  details: z.string().trim().min(15).max(4000),
  locale: z.enum(["en", "es", "pt", "nl", "fr", "de", "ar", "hi", "th"]).default("en"),
  website: z.string().max(200).default(""),
}).strict();
export type SupportSubmission = Omit<z.infer<typeof supportSubmission>, "website">;
export type SupportTicket = SupportSubmission & { id: string; status: keyof typeof supportStatuses; notes: string; revision: number; createdAt: string; updatedAt: string };
export const supportCommand = z.discriminatedUnion("action", [
  z.object({ action: z.literal("update"), id: z.uuid(), revision: z.number().int().nonnegative(), status: z.enum(["new", "reviewing", "resolved", "spam"]), notes: z.string().trim().max(4000) }),
  z.object({ action: z.literal("delete"), id: z.uuid(), revision: z.number().int().nonnegative() }),
]);
export const supportRetentionMs = 90 * 24 * 60 * 60 * 1000;
