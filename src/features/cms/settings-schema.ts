import { z } from "zod";

export const knownSettingKeys = [
  "siteName",
  "timezone",
  "publishingMode",
  "cmsApiEnabled",
  "mediaPipelineEnabled",
  "seoSyncEnabled",
  "supportEmail",
  "supportPhone",
  "logoUrl",
] as const;

export type KnownSettingKey = (typeof knownSettingKeys)[number];

export const publishingModes = ["Draft + publish", "Draft only", "Publish immediately"] as const;

export const settingUpdateSchema = z.object({
  id: z.string().min(1).optional(),
  key: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).optional(),
  value: z.string().trim().max(2000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  version: z.number().int().nonnegative(),
});

export function validateSettingValue(key: string, value: string): string | null {
  const normalized = value.trim();

  if (key === "siteName") {
    return normalized.length >= 1 && normalized.length <= 120 ? null : "Site name must be between 1 and 120 characters.";
  }
  if (["cmsApiEnabled", "mediaPipelineEnabled", "seoSyncEnabled"].includes(key)) {
    return normalized === "true" || normalized === "false" ? null : "Choose true or false.";
  }
  if (key === "publishingMode") {
    return publishingModes.includes(normalized as (typeof publishingModes)[number]) ? null : "Choose a valid publishing mode.";
  }
  if (key === "timezone") {
    return normalized && typeof Intl !== "undefined" ? null : "Choose a valid timezone.";
  }
  if (key === "supportEmail") {
    if (!normalized) return null;
    return z.string().email("Enter a valid email address.").safeParse(normalized).success ? null : "Enter a valid email address.";
  }
  if (key === "supportPhone") {
    if (!normalized) return null;
    return /^[+()\d\s-]{5,40}$/.test(normalized) ? null : "Enter a valid phone number.";
  }
  if (key === "logoUrl") {
    if (!normalized) return "Logo URL is required.";
    return normalized.startsWith("/") || /^https?:\/\//i.test(normalized) ? null : "Logo URL must be a relative path or HTTPS/HTTP URL.";
  }
  if (["secret", "password", "token", "apiKey", "authSecret"].some((name) => key.toLowerCase().includes(name.toLowerCase()))) {
    return "Secret and environment values cannot be stored here.";
  }
  return normalized.length <= 2000 ? null : "Value must be 2000 characters or fewer.";
}
