import { z } from "zod";

export const contentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"]);

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be URL-safe and lowercase or hyphenated.");

export const urlSchema = z.string().trim().url({ message: "Must be a valid absolute URL." });

export const pageBlockSchema = z.object({
  type: z.enum([
    "hero",
    "cta",
    "ctaButton",
    "features",
    "services",
    "servicesHero",
    "servicesFeatures",
    "servicesProcess",
    "servicesAudiences",
    "servicesBenefits",
    "servicesStats",
    "servicesFaq",
    "servicesCta",
    "homePhilosophy",
    "homeReasons",
    "homeServices",
    "homeOffers",
    "homeProcess",
    "homeCta",
    "aboutCapabilities",
    "aboutValues",
    "aboutCommitments",
    "aboutTimeline",
    "testimonials",
    "gallery",
    "faq",
    "stats",
    "pricing",
    "team",
    "richText",
    "video",
    "contact",
    "form",
    "customSection",
  ]),
  order: z.number().int().nonnegative(),
  props: z.record(z.string(), z.any()).default({}),
});

export const createPageSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  status: contentStatusSchema.default("DRAFT"),
  blocks: z.array(pageBlockSchema).default([]),
  seo: z
    .object({
      title: z.string().trim().max(200).optional(),
      description: z.string().trim().max(300).optional(),
      keywords: z.array(z.string().trim()).optional(),
      canonical: z.string().trim().url().optional(),
      robots: z.string().trim().optional(),
    })
    .optional(),
});

export const scrapeRequestSchema = z.object({
  url: urlSchema,
  mode: z.enum(["static", "hybrid", "browser"]).default("static"),
  maxDepth: z.number().int().min(0).max(5).default(1),
  limit: z.number().int().min(1).max(200).default(25),
  includeMedia: z.boolean().default(true),
  incremental: z.boolean().default(true),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type ScrapeRequestInput = z.infer<typeof scrapeRequestSchema>;
