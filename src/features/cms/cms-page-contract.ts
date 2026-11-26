import { z } from "zod";

export const pageFooterGroupSchema = z.enum(["QUICK_LINKS", "SERVICES", "LEGAL"]);
export const pageStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export const pageStarterSchema = z.enum(["BLANK", "HERO_TEXT", "HERO_TEXT_CTA"]);

export const cmsPageCreateUpdateSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, "Title is required.").max(120, "Title must be 120 characters or fewer."),
  slug: z.string().trim().min(1, "Address is required.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  status: pageStatusSchema,
  version: z.number().int().optional(),
  showInHeader: z.boolean().optional().default(false),
  headerLabel: z.string().trim().max(120).optional().nullable(),
  headerPosition: z.number().int().min(0).optional().default(0),
  showInFooter: z.boolean().optional().default(false),
  footerGroup: pageFooterGroupSchema.optional().default("QUICK_LINKS"),
  footerLabel: z.string().trim().max(120).optional().nullable(),
  footerPosition: z.number().int().min(0).optional().default(0),
  starter: pageStarterSchema.optional().default("HERO_TEXT"),
  seo: z.object({
    title: z.string().trim().max(60, "Page title should be 60 characters or fewer.").nullable().optional(),
    description: z.string().trim().max(160, "Description should be 160 characters or fewer.").nullable().optional(),
  }).optional(),
  blocks: z.array(z.object({
    id: z.string().optional(),
    type: z.string(),
    order: z.number().int().optional(),
    props: z.record(z.string(), z.unknown()).optional().default({}).superRefine((props, ctx) => {
      if (props && typeof props.formSlug === "string" && props.formSlug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(props.formSlug.trim())) {
        ctx.addIssue({ code: "custom", message: "Form block formSlug must be a valid slug." });
      }
    }),
  }).superRefine((block, ctx) => {
    if (block.type.trim().toLowerCase() === "form" && typeof block.props?.formSlug !== "undefined" && typeof block.props.formSlug !== "string") {
      ctx.addIssue({ code: "custom", message: "Form block formSlug must be a string." });
    }
  })).optional().default([]),
});

export const cmsPageBlockResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
  order: z.number(),
  version: z.number().optional().default(1),
});

export const cmsPageResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  status: z.string(),
  version: z.number(),
  seo: z.object({
    id: z.string().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    keywords: z.string().nullable().optional(),
    canonical: z.string().nullable().optional(),
  }).optional(),
  blocks: z.array(cmsPageBlockResponseSchema),
});

export const cmsSaveResponseSchema = z.object({
  success: z.literal(true),
  page: cmsPageResponseSchema,
});

export type CmsPageBlockResponse = z.infer<typeof cmsPageBlockResponseSchema>;
export type CmsPageResponse = z.infer<typeof cmsPageResponseSchema>;
export type CmsSaveResponse = z.infer<typeof cmsSaveResponseSchema>;
