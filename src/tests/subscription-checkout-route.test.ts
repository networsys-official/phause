import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/subscriptions/checkout/route";

function checkoutRequest(body: unknown, authorization?: string) {
  return new Request("http://localhost/api/subscriptions/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(authorization ? { authorization } : {}),
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ADMIN_PLANS_API_URL;
});

describe("subscription checkout route", () => {
  it("returns 401 without a Bearer token", async () => {
    const response = await POST(checkoutRequest({ planId: "plan-1", provider: "stripe" }));
    expect(response.status).toBe(401);
  });

  it("returns 400 for missing planId", async () => {
    const response = await POST(checkoutRequest({ provider: "stripe" }, "Bearer test-token"));
    expect(response.status).toBe(400);
  });

  it("returns 400 for an invalid provider", async () => {
    const response = await POST(checkoutRequest({ planId: "plan-1", provider: "bitcoin" }, "Bearer test-token"));
    expect(response.status).toBe(400);
  });

  it("passes upstream error status and message", async () => {
    process.env.ADMIN_PLANS_API_URL = "https://admin.example";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Payment provider rejected the plan" }), { status: 422 })));
    const response = await POST(checkoutRequest({ planId: "plan-1", provider: "paypal" }, "Bearer test-token"));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ message: "Payment provider rejected the plan" });
  });

  it("returns 502 on network failure", async () => {
    process.env.ADMIN_PLANS_API_URL = "https://admin.example";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const response = await POST(checkoutRequest({ planId: "plan-1", provider: "stripe" }, "Bearer test-token"));
    expect(response.status).toBe(502);
  });

  it("returns 503 when ADMIN_PLANS_API_URL is missing", async () => {
    const response = await POST(checkoutRequest({ planId: "plan-1", provider: "stripe" }, "Bearer test-token"));
    expect(response.status).toBe(503);
  });

  it("returns the upstream success body", async () => {
    process.env.ADMIN_PLANS_API_URL = "https://admin.example/";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ checkoutUrl: "https://pay.example/session" }), { status: 201 })));
    const response = await POST(checkoutRequest({ planId: "plan-1", provider: "razorpay" }, "Bearer test-token"));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ checkoutUrl: "https://pay.example/session" });
  });
});
