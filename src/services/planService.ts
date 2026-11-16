import type { SubscriptionPlanResponse } from "@/types/plan";

type PlanListResponse =
    | SubscriptionPlanResponse[]
    | { data: SubscriptionPlanResponse[] };

type PlanResponse =
    | SubscriptionPlanResponse
    | { data: SubscriptionPlanResponse };

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
         const result = await get<PlanListResponse>("/api/plans");

         return Array.isArray(result)
             ? result
             : result.data;
    },

    /**
     * Get a single subscription plan
     */
    getPlanById: async (
        planId: string
    ): Promise<SubscriptionPlanResponse> => {
        const result = await get<PlanResponse>(`/api/plans/${planId}`);
        return "data" in result ? result.data : result;
    },
};