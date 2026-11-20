import { z } from "zod";

export const subscriptionBoolean = z.boolean().optional();
export const subscriptionText = z.string().max(2000).optional().nullable();

export const subscriptionCmsPayloadSchema = z.object({
  page: z.object({
    title: z.string().min(1).max(255),
    slug: z.literal("subscription"),
    metaTitle: z.string().max(255).optional().nullable(),
    metaDescription: z.string().max(1000).optional().nullable(),
    ogImage: z.string().max(2000).optional().nullable(),
    active: z.boolean(),
    sectionOrder: z.array(z.string()).optional(),
  }),
  hero: z.object({
    badgeText: z.string().max(255), badgeIcon: z.string().max(100), badgeVisible: z.boolean(),
    heading: z.string().min(1).max(255), highlightedWord: z.string().min(1).max(100), subtitle: z.string().max(2000),
    backgroundImage: z.string().max(2000).optional().nullable(), ctaPrimaryText: z.string().max(255), ctaPrimaryUrl: z.string().max(2000),
    ctaSecondaryText: z.string().max(255).optional().nullable(), ctaSecondaryUrl: z.string().max(2000).optional().nullable(),
    accentColor: z.string().max(100), overlayColor: z.string().max(100), visible: z.boolean(), sortOrder: z.number().int().min(0),
  }),
  trustItems: z.array(z.object({ id: z.string().optional(), icon: z.string(), title: z.string(), description: z.string().optional().nullable(), visible: z.boolean(), sortOrder: z.number().int().min(0) })),
  pricing: z.object({ title: z.string(), subtitle: z.string().optional().nullable(), badgeText: z.string().optional().nullable(), accentColor: z.string(), visible: z.boolean(), sortOrder: z.number().int().min(0) }),
  plans: z.array(z.unknown()).optional().default([]),
  comparison: z.object({ title: z.string(), subtitle: z.string().optional().nullable(), visible: z.boolean(), sortOrder: z.number().int().min(0) }),
  comparisonRows: z.array(z.object({ id: z.string().optional(), name: z.string(), freeValue: z.string(), starterValue: z.string(), professionalValue: z.string(), businessValue: z.string(), enterpriseValue: z.string(), sortOrder: z.number().int().min(0), active: z.boolean() })),
  faq: z.object({ title: z.string(), subtitle: z.string().optional().nullable(), visible: z.boolean(), sortOrder: z.number().int().min(0) }),
  faqs: z.array(z.object({ id: z.string().optional(), question: z.string(), answer: z.string(), sortOrder: z.number().int().min(0), active: z.boolean() })),
  testimonials: z.object({ title: z.string(), subtitle: z.string().optional().nullable(), visible: z.boolean(), sortOrder: z.number().int().min(0) }),
  testimonialItems: z.array(z.object({ id: z.string().optional(), name: z.string(), company: z.string().optional().nullable(), designation: z.string().optional().nullable(), image: z.string().optional().nullable(), rating: z.number().int().min(1).max(5), review: z.string(), active: z.boolean(), sortOrder: z.number().int().min(0) })),
  cta: z.object({ title: z.string(), description: z.string().optional().nullable(), buttonText: z.string(), buttonUrl: z.string(), backgroundImage: z.string().optional().nullable(), visible: z.boolean(), sortOrder: z.number().int().min(0) }),
});

export type SubscriptionCmsPayload = z.infer<typeof subscriptionCmsPayloadSchema>;
