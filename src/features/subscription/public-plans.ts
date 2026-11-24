import { parseAdminPlans, type AdminPlan } from "@/features/subscription/admin-plan-schema";

function getPlansEndpoint(): string {
  const publicEndpoint = process.env.NEXT_PUBLIC_PLANS_API_URL?.trim();
  if (publicEndpoint) return publicEndpoint.replace(/\/$/, "");

  throw new Error("Plans API is not configured. Set NEXT_PUBLIC_PLANS_API_URL.");
}

export async function fetchPublicPlans(signal?: AbortSignal): Promise<AdminPlan[]> {
  const endpoint = getPlansEndpoint();

  let response: Response;
  try {
    response = await fetch(endpoint, { cache: "no-store", signal });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Plans API network/CORS request failed for ${endpoint}: ${reason}`);
  }

  if (!response.ok) {
    throw new Error(`Plans API returned HTTP ${response.status} from ${endpoint}.`);
  }

  return parseAdminPlans(await response.json());
}

function isLocalBrowser(): boolean {
  if (typeof window === "undefined" || process.env.NODE_ENV === "test") return false;
  return ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
}

export async function loadSubscriptionPlans(signal?: AbortSignal): Promise<AdminPlan[]> {
  if (isLocalBrowser()) {
    try {
      const response = await fetch("/api/plans", { cache: "no-store", signal });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : `HTTP ${response.status}`;
        throw new Error(`Plans fallback returned ${message} (HTTP ${response.status}) from /api/plans.`);
      }
      return parseAdminPlans(payload);
    } catch (fallbackError) {
      const reason = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      if (process.env.NODE_ENV === "development") {
        console.error("[subscription] local plans fallback failed", { url: "/api/plans", reason });
      }
      throw new Error(reason);
    }
  }

  try {
    return await fetchPublicPlans(signal);
  } catch (directError) {
    if (signal?.aborted) throw directError;
    const reason = directError instanceof Error ? directError.message : String(directError);
    if (process.env.NODE_ENV === "development") {
      console.error("[subscription] direct plans request failed", { reason });
    }
  }

  try {
    const response = await fetch("/api/plans", { cache: "no-store", signal });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `HTTP ${response.status}`;
      throw new Error(`Plans fallback returned ${message} (HTTP ${response.status}) from /api/plans.`);
    }
    return parseAdminPlans(payload);
  } catch (fallbackError) {
    const reason = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
    if (process.env.NODE_ENV === "development") {
      console.error("[subscription] plans fallback failed", { url: "/api/plans", reason });
    }
    throw new Error(reason);
  }
}
