import { z } from "zod";

export const cmsPageBlockResponseSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()),
  order: z.number(),
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
