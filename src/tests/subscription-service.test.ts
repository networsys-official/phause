import { describe, expect, it, vi, afterEach } from "vitest";
import { extractCheckoutUrl } from "@/services/subscription.service";

afterEach(() => vi.unstubAllGlobals());

describe("subscriptionService.extractCheckoutUrl", () => {
  it.each([
    ["checkoutUrl", { checkoutUrl: "https://pay.example/one" }],
    ["checkout_url", { checkout_url: "https://pay.example/two" }],
    ["paymentUrl", { paymentUrl: "https://pay.example/three" }],
    ["payment_url", { payment_url: "https://pay.example/four" }],
    ["url", { url: "https://pay.example/five" }],
  ])("accepts %s", (_field, result) => {
    expect(extractCheckoutUrl(result)).toMatch(/^https:\/\/pay\.example\/\w+$/);
  });

  it("accepts a nested data object", () => {
    expect(extractCheckoutUrl({ data: { payment_url: "https://pay.example/nested" } })).toBe("https://pay.example/nested");
  });

  it("throws when no recognized URL is found", () => {
    expect(() => extractCheckoutUrl({ status: "ok" })).toThrow("The checkout API did not return a recognized payment URL. Please verify its response format.");
  });
});
