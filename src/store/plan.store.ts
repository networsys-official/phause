import { create } from "zustand";
import { planService } from "@/services/planService";
import { SubscriptionPlanResponse } from "@/types/plan";

interface PlanStore {
    plans: SubscriptionPlanResponse[];
    isLoading: boolean;
    error: string | null;

    fetchPlans: () => Promise<void>;
    clearError: () => void;
}

export const usePlanStore = create<PlanStore>((set) => ({
    plans: [],
    isLoading: false,
    error: null,

    fetchPlans: async () => {
        set({
            isLoading: true,
            error: null,
        });

        try {
            const plans = await planService.getPlans();

            set({
                plans: plans.filter((plan) => plan.isActive),
                isLoading: false,
                error: null,
            });
        } catch (error: unknown) {
            console.error("Failed to fetch subscription plans:", error);

            let message = "Unable to load subscription plans.";

            if (error instanceof Error) {
                message = error.message;
            } else if (
                typeof error === "object" &&
                error !== null &&
                "response" in error
            ) {
                const response = (
                    error as {
                        response?: {
                            data?: {
                                message?: string;
                            };
                        };
                    }
                ).response;

                message = response?.data?.message ?? message;
            }

            set({
                plans: [],
                isLoading: false,
                error: message,
            });
        }
    },

    clearError: () => set({ error: null }),
}));