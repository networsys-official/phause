import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/plans/route";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.ADMIN_PLANS_API_URL;
});

describe("/api/plans upstream states", () => {
  it("returns 503 for a failing upstream with a request id", async () => {
    process.env.ADMIN_PLANS_API_URL = "https://admin.invalid";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("TLS certificate failed")));

    const response = await GET(new NextRequest("http://localhost/api/plans", { headers: { "x-request-id": "test-request-failure" } }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.requestId).toBe("test-request-failure");
    expect(body.code).toBe("UPSTREAM_UNAVAILABLE");
  });

  it("returns 200 with an empty list for a valid empty upstream", async () => {
    process.env.ADMIN_PLANS_API_URL = "https://admin.invalid";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200, headers: { "content-type": "application/json" } })));

    const response = await GET(new NextRequest("http://localhost/api/plans", { headers: { "x-request-id": "test-request-empty" } }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.plans).toEqual([]);
  });

  it("returns 500 with zod field issues for an invalid upstream row", async () => {
    process.env.ADMIN_PLANS_API_URL = "https://admin.invalid";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 123, name: "", features: null }]), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await GET(new NextRequest("http://localhost/api/plans", { headers: { "x-request-id": "test-request-invalid" } }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("INVALID_UPSTREAM");
  });
});
