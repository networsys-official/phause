import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/plans/route";
import { fetchPublicPlans, loadSubscriptionPlans } from "@/features/subscription/public-plans";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_PLANS_API_URL;
  delete process.env.ADMIN_PLANS_API_URL;
});

describe("public subscription plans API", () => {
  it("fetches the full external endpoint directly and validates the array response", async () => {
    process.env.NEXT_PUBLIC_PLANS_API_URL = "https://phishingsimulation.webandappdevelopmenttech.com/api/plans";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      {
        id: "starter-id",
        name: "Starter",
        description: "For small teams.",
        price: "29.00",
        currency: "usd",
        billingCycle: "MONTHLY",
        maxCampaigns: 20,
        maxUsers: 70,
        features: { apiQuotaMonthly: 1000, premiumTemplates: true, phishing_campaigns: true },
        isActive: true,
        trialDays: 0,
      },
    ]), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const plans = await fetchPublicPlans();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://phishingsimulation.webandappdevelopmenttech.com/api/plans",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({
      name: "Starter",
      price: 29,
      billingCycle: "MONTHLY",
      features: { apiQuotaMonthly: 1000 },
    });
  });


  it("supports the legacy ADMIN_PLANS_API_URL for local compatibility", async () => {
    process.env.ADMIN_PLANS_API_URL = "https://plans.invalid";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: "legacy-id",
      name: "Legacy",
      price: "10",
      billingCycle: "MONTHLY",
    }]), { status: 200 })));

    const plans = await fetchPublicPlans();

    expect(plans[0]?.name).toBe("Legacy");
  });

  it("returns an empty list for a valid empty API response", async () => {
    process.env.NEXT_PUBLIC_PLANS_API_URL = "https://plans.invalid/api/plans";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200 })));

    await expect(fetchPublicPlans()).resolves.toEqual([]);
  });

  it("serves plans through the same-origin fallback", async () => {
    process.env.NEXT_PUBLIC_PLANS_API_URL = "https://plans.invalid/api/plans";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: "starter-id",
      name: "Starter",
      price: "29",
      billingCycle: "MONTHLY",
    }]), { status: 200 })));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.plans).toHaveLength(1);
    expect(body.plans[0].name).toBe("Starter");
  });

  it("falls back to the app endpoint when the browser cannot read the external API", async () => {
    process.env.NEXT_PUBLIC_PLANS_API_URL = "https://plans.invalid/api/plans";
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        plans: [{
          id: "free-id",
          name: "Free",
          price: "0",
          billingCycle: "MONTHLY",
          features: {},
        }],
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const plans = await loadSubscriptionPlans();

    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://plans.invalid/api/plans", expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/plans", expect.any(Object));
    expect(plans.map((plan) => plan.name)).toEqual(["Free"]);
  });

  it("rejects an invalid API response", async () => {
    process.env.NEXT_PUBLIC_PLANS_API_URL = "https://plans.invalid/api/plans";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 123, name: "", features: null }]), { status: 200 })));

    await expect(fetchPublicPlans()).rejects.toThrow("plans response");
  });
});
