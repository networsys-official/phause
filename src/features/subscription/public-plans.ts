import { parseAdminPlans, type AdminPlan } from "@/features/subscription/admin-plan-schema";

export async function fetchPublicPlans(signal?: AbortSignal): Promise<AdminPlan[]> {
  const endpoint = process.env.NEXT_PUBLIC_PLANS_API_URL?.trim();
  if (!endpoint) throw new Error("NEXT_PUBLIC_PLANS_API_URL is not configured.");

  const response = await fetch(endpoint, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Plans API returned HTTP ${response.status}.`);

  return parseAdminPlans(await response.json());
}

export async function loadSubscriptionPlans(signal?: AbortSignal): Promise<AdminPlan[]> {
  try {
    return await fetchPublicPlans(signal);
  } catch (directError) {
    if (signal?.aborted) throw directError;
    console.warn(
      "[subscription] direct plans request failed; retrying through the app",
      directError instanceof Error ? directError.message : String(directError),
    );
  }

  const response = await fetch("/api/plans", { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Plans fallback returned HTTP ${response.status}.`);

  const payload: unknown = await response.json();
  return parseAdminPlans(payload);
}
