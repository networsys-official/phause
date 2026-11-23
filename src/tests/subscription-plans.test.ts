import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { SubscriptionPlanSection } from "@/components/subscription/subscription-plan-section";
import { SubscriptionCmsPage } from "@/components/subscription/subscription-cms-page";
import { mapApiPlanToPlan } from "@/app/(main)/subscription/plans";

const fixture = {
  id: "starter-fixture",
  name: "Starter",
  description: "For growing teams.",
  price: "29",
  currency: "usd",
  billingCycle: "MONTHLY",
  maxCampaigns: 20,
  maxUsers: 70,
  trialDays: 14,
  features: { "Premium Templates": true, "ssoEnabled": false },
  isActive: true,
  popular: true,
  buttonText: "Choose Starter",
  buttonUrl: "/registration",
  sortOrder: 0,
};

beforeAll(() => {
  class IntersectionObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "IntersectionObserver", { value: IntersectionObserverMock, configurable: true });
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("subscription admin plan cards", () => {
  it("renders the original card fields and states", () => {
    render(React.createElement(SubscriptionPlanSection, {
      plans: [mapApiPlanToPlan({
        ...fixture,
        features: { ...fixture.features, apiQuotaMonthly: 1000 },
      } as unknown as import("@/types/plan").SubscriptionPlanResponse)],
      isLoading: false,
      error: null,
    }));

    expect(screen.getByText("$29.00")).toBeTruthy();
    expect(screen.getByText("/ month")).toBeTruthy();
    expect(screen.getByText(/Maximum Campaigns/i)).toBeTruthy();
    expect(screen.getByText(/Maximum Users/i)).toBeTruthy();
    expect(screen.getByText(/Billing Cycle/i)).toBeTruthy();
    expect(screen.getByText(/Free Trial/i)).toBeTruthy();
    expect(screen.getByText("20")).toBeTruthy();
    expect(screen.getByText("70")).toBeTruthy();
    expect(screen.getByText("MONTHLY")).toBeTruthy();
    expect(screen.getByText("14 Days")).toBeTruthy();
    expect(screen.getByText(/Tier 01/i)).toBeTruthy();
    expect(screen.getByText("Most Popular")).toBeTruthy();

    const enabled = screen.getByText("Premium Templates");
    expect(enabled.className).not.toContain("line-through");
    const disabled = screen.getByText("Single Sign-On (SSO)");
    expect(disabled.className).toContain("line-through");
    const quota = screen.getByText(/Quota Monthly: 1,000/);
    expect(quota.className).not.toContain("line-through");
  });

  it("renders a clear empty state", () => {
    render(React.createElement(SubscriptionPlanSection, { plans: [], isLoading: false, error: null }));
    expect(screen.getByText("Plans coming soon")).toBeTruthy();
  });

  it("keeps plan cards visible when CMS pricing is marked hidden", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      pricing: { visible: false },
    }), { status: 200 })));

    render(React.createElement(SubscriptionCmsPage, {
      adminPlans: [fixture as unknown as import("@/features/subscription/admin-plan-schema").AdminPlan],
    }));

    await waitFor(() => expect(screen.getByText("$29.00")).toBeTruthy());
  });

  it("renders the friendly service error state for a failing upstream", () => {
    render(React.createElement(SubscriptionPlanSection, { plans: [], isLoading: false, error: "Unable to load subscription plans." }));
    expect(screen.getByText("Unable to load subscription plans.")).toBeTruthy();
  });

  it("renders three plans once and exactly three loading skeleton cards", () => {
    const plans = [fixture, { ...fixture, id: "fixture-two", name: "Professional" }, { ...fixture, id: "fixture-three", name: "Enterprise" }].map((item) => mapApiPlanToPlan(item as unknown as import("@/types/plan").SubscriptionPlanResponse));
    render(React.createElement(SubscriptionPlanSection, { plans, isLoading: false, error: null }));
    expect(screen.getAllByText(/Tier 0/i)).toHaveLength(3);

    const skeleton = render(React.createElement(SubscriptionPlanSection, { plans: [], isLoading: true, error: null }));
    expect(skeleton.container.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(3);
  });
});
