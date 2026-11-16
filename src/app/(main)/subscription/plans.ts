import {
    SubscriptionPlanResponse,
    PlanFeatures,
} from "@/types/plan";

/* ══════════════════ PLAN INTERFACE ══════════════════ */

export interface Plan {
    id: string;
    name: string;
    tagline: string;

    priceMonthly: number | null;
    priceYearly: number | null;
    currency: string;

    cta: string;
    popular?: boolean;

    accent: "cyan" | "teal" | "violet" | "amber" | "slate";

    billingCycle: string;
    trialDays: number;

    stats: {
        label: string;
        value: string;
    }[];

    features: {
        label: string;
        included: boolean;
    }[];

    rawFeatures: PlanFeatures;
    maxCampaigns: number;
    maxUsers: number;
}

/* ══════════════════ FEATURE LABELS ══════════════════ */

const FEATURE_LABELS: Record<string, string> = {
    apiAccess: "API Access",
    api_access: "API Access",

    ssoEnabled: "Single Sign-On (SSO)",

    premiumTemplates: "Premium Email Templates",
    customTemplates: "Custom Email Templates",
    custom_templates: "Custom Email Templates",

    auditLogs: "Audit Logs",

    aiNarratives: "AI-Generated Narratives",

    risk_scoring: "Risk Scoring",

    advanced_reports: "Advanced Reports",

    training_modules: "Training Modules",

    phishing_campaigns: "Phishing Campaigns",

    bulk_employee_import: "Bulk Employee Import",
};

/* ══════════════════ HELPERS ══════════════════ */

function formatFeatureName(key: string): string {
    return (
        FEATURE_LABELS[key] ||
        key
            .replace(/([A-Z])/g, " $1")
            .replace(/[_-]/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
            .trim()
    );
}

function formatLimit(value: number): string {
    return value === 0 ? "Unlimited" : value.toLocaleString();
}

function getPlanAccent(
    name: string
): Plan["accent"] {
    const normalized = name.toLowerCase();

    if (normalized.includes("free")) return "slate";
    if (normalized.includes("starter")) return "teal";
    if (normalized.includes("professional")) return "cyan";
    if (normalized.includes("enterprise")) return "violet";

    return "amber";
}

function getPlanCTA(name: string): string {
    const normalized = name.toLowerCase();

    if (normalized.includes("free")) return "Start Free";
    if (normalized.includes("enterprise")) return "Choose Enterprise";

    return `Choose ${name}`;
}

/* ══════════════════ API RESPONSE MAPPER ══════════════════ */

export function mapApiPlanToPlan(
    apiPlan: SubscriptionPlanResponse
): Plan {
    const price = Number(apiPlan.price);

    const features = Object.entries(apiPlan.features || {}).map(
        ([key, value]) => ({
            label: formatFeatureName(key),
            included: value === true,
        })
    );

    const stats = [
        {
            label: "Maximum Campaigns",
            value: formatLimit(apiPlan.maxCampaigns),
        },
        {
            label: "Maximum Users",
            value: formatLimit(apiPlan.maxUsers),
        },
        {
            label: "Billing Cycle",
            value: apiPlan.billingCycle,
        },
        {
            label: "Free Trial",
            value:
                apiPlan.trialDays > 0
                    ? `${apiPlan.trialDays} Days`
                    : "No Trial",
        },
    ];

    return {
        id: apiPlan.id,
        name: apiPlan.name,
        tagline: apiPlan.description,

        priceMonthly: price,
        priceYearly: null,
        currency: apiPlan.currency.toUpperCase(),

        cta: getPlanCTA(apiPlan.name),

        popular:
            apiPlan.name.toLowerCase() === "professional",

        accent: getPlanAccent(apiPlan.name),

        billingCycle: apiPlan.billingCycle,
        trialDays: apiPlan.trialDays,

        stats,
        features,

        rawFeatures: apiPlan.features || {},

        maxCampaigns: apiPlan.maxCampaigns,
        maxUsers: apiPlan.maxUsers,
    };
}

/* ══════════════════ SHARED CONSTANTS ══════════════════ */

export const BILLING_CYCLE_STORAGE_KEY =
    "phause-billing-cycle";

/* ══════════════════ PRICE FORMATTER ══════════════════ */

export function formatPrice(
    plan: Plan,
    cycle: "monthly" | "yearly" = "monthly"
): string {
    if (plan.priceMonthly === null) return "Custom";

    const price =
        cycle === "monthly"
            ? plan.priceMonthly
            : plan.priceYearly;

    if (price === null) return "Custom";

    return new Intl.NumberFormat("en", {
        style: "currency",
        currency: plan.currency || "USD",
        maximumFractionDigits: 2,
    }).format(price);
}