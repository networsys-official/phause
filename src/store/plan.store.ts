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
        } catch (error: any) {
            console.error("Failed to fetch subscription plans:", error);

            set({
                plans: [],
                isLoading: false,
                error:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Unable to load subscription plans.",
            });
        }
    },

    clearError: () => set({ error: null }),
}));