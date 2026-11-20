import { z } from "zod";

const adminFeatureSchema = z.union([z.boolean(), z.number(), z.string()]);

export const adminPlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().default(""),
  price: z.union([z.string(), z.number()]).transform((value) => Number(value)),
  yearlyPrice: z.union([z.string(), z.number(), z.null()]).optional().transform((value) => value == null ? null : Number(value)),
  currency: z.string().default("usd"),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "monthly", "yearly"]).transform((value) => value.toUpperCase()),
  maxCampaigns: z.number().nullable().optional().default(0),
  maxUsers: z.number().nullable().optional().default(0),
  trialDays: z.number().nullable().optional().default(0),
  features: z.record(z.string(), adminFeatureSchema).default({}),
  isActive: z.boolean().optional().default(true),
  active: z.boolean().optional(),
  popular: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  buttonText: z.string().optional().nullable(),
  buttonUrl: z.string().optional().nullable(),
  sortOrder: z.number().optional().default(0),
}).transform((plan) => ({
  ...plan,
  popular: plan.popular ?? plan.isPopular ?? false,
  buttonText: plan.buttonText ?? `Choose ${plan.name}`,
  buttonUrl: plan.buttonUrl ?? "/registration",
}));

export type AdminPlan = z.infer<typeof adminPlanSchema>;

export type PlanFeatureView = {
  label: string;
  included: boolean;
};

export async function getAdminPlans(): Promise<AdminPlan[]> {
  const baseUrl = process.env.ADMIN_PLANS_API_URL?.trim();
  if (!baseUrl) throw new Error("ADMIN_PLANS_API_URL is not configured.");
  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/plans`;
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) throw new Error(`Admin plans request failed (${response.status}).`);

  const result: unknown = await response.json();
  const rows = Array.isArray(result) ? result : (result && typeof result === "object" && "data" in result && Array.isArray((result as { data?: unknown }).data))
    ? (result as { data: unknown[] }).data
    : [];

  return rows
    .map((row) => adminPlanSchema.safeParse(row))
    .filter((parsed): parsed is z.ZodSafeParseSuccess<AdminPlan> => parsed.success)
    .map((parsed) => parsed.data)
    .filter((plan) => plan.isActive !== false && plan.active !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function formatAdminPrice(plan: AdminPlan): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (plan.currency || "USD").toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(plan.price);
}

export function formatBillingCycle(plan: AdminPlan): string {
  return plan.billingCycle === "YEARLY" ? "year" : "month";
}

export function formatAdminFeatures(plan: AdminPlan): PlanFeatureView[] {
  return Object.entries(plan.features).map(([label, value]) => {
    const included = typeof value === "boolean" ? value : typeof value === "number" ? value > 0 : typeof value === "string" ? value.trim().length > 0 : false;
    return { label, included };
  });
}
