import {
    SubscriptionPlanResponse,
    PlanFeatures,
} from "@/types/plan";

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

function getPlanAccent(name: string): Plan["accent"] {
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

export function mapApiPlanToPlan(apiPlan: SubscriptionPlanResponse): Plan {
    const price = Number(apiPlan.price);

    const features = Object.entries(apiPlan.features || {}).map(([key, value]) => {
        const cmsFeatureText = key.startsWith("feature_") && typeof value === "string" ? value : null;
        const label = cmsFeatureText
            ?? (typeof value === "number" ? `${formatFeatureName(key)}: ${value.toLocaleString()}` : formatFeatureName(key));
        return {
            label,
            included: cmsFeatureText !== null || (typeof value === "boolean" ? value : typeof value === "number" ? value > 0 : value.trim().length > 0),
        };
    });

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
            value: apiPlan.trialDays > 0 ? `${apiPlan.trialDays} Days` : "No Trial",
        },
    ];

    return {
        id: apiPlan.id,
        name: apiPlan.name,
        tagline: apiPlan.description,
        priceMonthly: price,
        priceYearly: price,
        currency: apiPlan.currency.toUpperCase(),
        cta: getPlanCTA(apiPlan.name),
        popular: (apiPlan as unknown as { popular?: boolean }).popular === true || (apiPlan as unknown as { isPopular?: boolean }).isPopular === true || apiPlan.name.toLowerCase() === "professional",
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

export const PLANS: Plan[] = [
    {
        id: "sentinel-free",
        name: "Free",
        tagline: "For individuals and small teams getting started.",
        priceMonthly: 0,
        priceYearly: 0,
        currency: "USD",
        cta: "Start Free",
        accent: "slate",
        billingCycle: "MONTHLY",
        trialDays: 14,
        stats: [
            { label: "Protected Endpoints", value: "Up to 5" },
            { label: "Monthly Events", value: "1M" },
            { label: "Data Retention", value: "7 days" },
            { label: "Support", value: "Community" },
        ],
        features: [
            { label: "Core threat detection", included: true },
            { label: "Community rule packs", included: true },
            { label: "Phishing awareness training", included: true },
            { label: "Weekly posture report", included: true },
            { label: "Automation playbooks", included: false },
            { label: "Campaign event monitoring", included: false },
            { label: "Compliance automation", included: false },
        ],
        rawFeatures: {},
        maxCampaigns: 5,
        maxUsers: 10,
    },
    {
        id: "sentinel-starter",
        name: "Starter",
        tagline: "For growing teams that need real protection without enterprise overhead.",
        priceMonthly: 29,
        priceYearly: 24,
        currency: "USD",
        cta: "Choose Starter",
        accent: "teal",
        billingCycle: "MONTHLY",
        trialDays: 14,
        stats: [
            { label: "Protected Endpoints", value: "Up to 50" },
            { label: "Monthly Events", value: "100M" },
            { label: "Data Retention", value: "30 days" },
            { label: "Support", value: "Email, 12h SLA" },
        ],
        features: [
            { label: "Everything in Free", included: true },
            { label: "Behavioral ML detection", included: true },
            { label: "Automated response playbooks", included: true },
            { label: "Cloud posture scans", included: true },
            { label: "Secrets & dependency review", included: true },
            { label: "Campaign event monitoring", included: false },
            { label: "Compliance automation", included: false },
        ],
        rawFeatures: {},
        maxCampaigns: 50,
        maxUsers: 25,
    },
    {
        id: "sentinel-professional",
        name: "Professional",
        tagline: "Our flagship plan for teams that need maximum visibility and control.",
        priceMonthly: 99,
        priceYearly: 79,
        currency: "USD",
        cta: "Choose Professional",
        popular: true,
        accent: "cyan",
        billingCycle: "MONTHLY",
        trialDays: 21,
        stats: [
            { label: "Protected Endpoints", value: "Up to 500" },
            { label: "Monthly Events", value: "5B" },
            { label: "Data Retention", value: "1 year" },
            { label: "Support", value: "Account support options shown by plan" },
        ],
        features: [
            { label: "Everything in Starter", included: true },
            { label: "Campaign reporting and risk insights", included: true },
            { label: "Compliance automation", included: true },
            { label: "API security testing", included: true },
            { label: "Named security team", included: true },
            { label: "Custom detection rules", included: true },
            { label: "Threat intelligence feeds", included: false },
            { label: "Campaign reporting and planning", included: true },
        ],
        rawFeatures: {},
        maxCampaigns: 500,
        maxUsers: 100,
    },
    {
        id: "sentinel-business",
        name: "Business",
        tagline: "For enterprises with multi-cloud estates and strict regulatory demands.",
        priceMonthly: 299,
        priceYearly: 249,
        currency: "USD",
        cta: "Choose Business",
        accent: "violet",
        billingCycle: "MONTHLY",
        trialDays: 30,
        stats: [
            { label: "Employee records", value: "Configured" },
            { label: "Campaign activity", value: "Included" },
            { label: "Reporting", value: "Included" },
            { label: "Support", value: "Product guidance" },
        ],
        features: [
            { label: "Everything in Professional", included: true },
            { label: "Programme reporting and planning", included: true },
            { label: "Employee campaign management", included: true },
            { label: "Multi-organisation management", included: true },
            { label: "Training administration", included: true },
            { label: "Product guidance", included: true },
            { label: "Configured account support", included: true },
        ],
        rawFeatures: {},
        maxCampaigns: 5000,
        maxUsers: 250,
    },
];

export const BILLING_CYCLE_STORAGE_KEY = "phause-billing-cycle";

export function formatPrice(plan: Plan, cycle: "monthly" | "yearly" = "monthly"): string {
    if (plan.priceMonthly === null) return "Custom";

    const price = cycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
    if (price === null) return "Custom";

    return new Intl.NumberFormat("en", {
        style: "currency",
        currency: plan.currency || "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
}