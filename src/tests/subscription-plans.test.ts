import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { SubscriptionPlanSection } from "@/components/subscription/subscription-plan-section";
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
    render(React.createElement(SubscriptionPlanSection, { plans: [mapApiPlanToPlan(fixture as unknown as import("@/types/plan").SubscriptionPlanResponse)], isLoading: false, error: null }));

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
  });

  it("renders a clear empty state", () => {
    render(React.createElement(SubscriptionPlanSection, { plans: [], isLoading: false, error: null }));
    expect(screen.getByText("Plans coming soon")).toBeTruthy();
  });

  it("renders the friendly service error state for a failing upstream", () => {
    render(React.createElement(SubscriptionPlanSection, { plans: [], isLoading: false, error: "Unable to load subscription plans." }));
    expect(screen.getByText("Unable to load subscription plans.")).toBeTruthy();
  });
});
