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

export class AdminPlansValidationError extends Error {
  constructor(public readonly issues: Array<{ path: string; message: string }>) {
    super("The plans response did not match the expected schema.");
    this.name = "AdminPlansValidationError";
  }
}

export function parseAdminPlans(result: unknown): AdminPlan[] {
  const rows = Array.isArray(result)
    ? result
    : result && typeof result === "object" && "plans" in result && Array.isArray(result.plans)
      ? result.plans
      : result && typeof result === "object" && "data" in result && Array.isArray(result.data)
        ? result.data
      : [];

  const issues: Array<{ path: string; message: string }> = [];
  const valid: AdminPlan[] = [];

  rows.forEach((row, index) => {
    const parsed = adminPlanSchema.safeParse(row);
    if (parsed.success) valid.push(parsed.data);
    else parsed.error.issues.forEach((issue) => issues.push({
      path: `[${index}]${issue.path.length ? `.${issue.path.join(".")}` : ""}`,
      message: issue.message,
    }));
  });

  if (rows.length > 0 && valid.length === 0) throw new AdminPlansValidationError(issues);

  return valid
    .filter((plan) => plan.isActive !== false && plan.active !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
