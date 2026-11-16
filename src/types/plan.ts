export type BillingCycle = "MONTHLY" | "YEARLY";

export interface PlanFeatures {
    [key: string]: boolean | number | string;
}

export interface SubscriptionPlanResponse {
    id: string;
    name: string;
    description: string;
    price: string;
    currency: string;
    billingCycle: BillingCycle;
    maxCampaigns: number;
    maxUsers: number;
    features: PlanFeatures;
    isActive: boolean;
    trialDays: number;
    createdBy: string;
    gatewayPriceId: string | null;
    gatewayProductId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PlanApiResponse {
    data: SubscriptionPlanResponse[];
}