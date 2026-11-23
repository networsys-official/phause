import type { SubscriptionPlanResponse } from "@/types/plan";

type PlanListResponse =
    | SubscriptionPlanResponse[]
    | { data: SubscriptionPlanResponse[] }
    | { success: boolean; plans: SubscriptionPlanResponse[] };

type PlanResponse =
    | SubscriptionPlanResponse
    | { data: SubscriptionPlanResponse };

function getPlansEndpoint(): string {
    const endpoint = process.env.NEXT_PUBLIC_PLANS_API_URL?.trim();
    if (!endpoint) {
        throw new Error("NEXT_PUBLIC_PLANS_API_URL is not configured.");
    }

    return endpoint;
}

async function get<T>(url: string): Promise<T> {
    const response = await fetch(url, { cache: "no-store" });
    let result: unknown;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            `The subscription plans endpoint returned an invalid response (HTTP ${response.status}).`,
        );
    }

    if (!response.ok) {
        const message =
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
                ? result.message
                : `Request failed with status ${response.status}.`;

        throw new Error(message);
    }

    return result as T;
}

export const planService = {
    /**
     * Get all subscription plans
     */
     getPlans: async (): Promise<SubscriptionPlanResponse[]> => {
         const result = await get<PlanListResponse>(getPlansEndpoint());

         if (Array.isArray(result)) return result;
         if ("data" in result && Array.isArray(result.data)) return result.data;
         if ("plans" in result && Array.isArray((result as { plans?: unknown }).plans)) {
             return (result as { plans: SubscriptionPlanResponse[] }).plans;
         }
         return [];
    },

    /**
     * Get a single subscription plan
     */
    getPlanById: async (
        planId: string
    ): Promise<SubscriptionPlanResponse> => {
        const result = await get<PlanResponse>(`${getPlansEndpoint()}/${encodeURIComponent(planId)}`);
        return "data" in result ? result.data : result;
    },
};