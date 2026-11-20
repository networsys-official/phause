import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  AdminPlansConfigError,
  AdminPlansNetworkError,
  AdminPlansUpstreamError,
  AdminPlansValidationError,
  getAdminPlans,
} from "@/features/subscription/admin-plan-repository";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id")?.trim() || randomUUID();

  try {
    const plans = await getAdminPlans();
    return NextResponse.json(
      { success: true, requestId, configured: true, plans },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } },
    );
  } catch (error) {
    if (error instanceof AdminPlansConfigError) {
      console.error("[plans] request=%s cause=missing_config env=ADMIN_PLANS_API_URL", requestId);
      return NextResponse.json({ success: false, requestId, code: "CONFIG_ERROR", message: "Subscription plans are not configured." }, { status: 503, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
    }

    if (error instanceof AdminPlansNetworkError) {
      console.error("[plans] request=%s cause=network endpoint=%s", requestId, process.env.ADMIN_PLANS_API_URL ?? "", { error: String(error.cause) });
      return NextResponse.json({ success: false, requestId, code: "UPSTREAM_UNAVAILABLE", message: "The subscription plans service is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
    }

    if (error instanceof AdminPlansUpstreamError) {
      console.error("[plans] request=%s cause=upstream_http status=%d endpoint=%s", requestId, error.status, process.env.ADMIN_PLANS_API_URL ?? "");
      return NextResponse.json({ success: false, requestId, code: "UPSTREAM_ERROR", message: "The subscription plans service returned an upstream error." }, { status: 503, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
    }

    if (error instanceof AdminPlansValidationError) {
      console.error("[plans] request=%s cause=zod_validation issues=%o", requestId, error.issues);
      return NextResponse.json({ success: false, requestId, code: "INVALID_UPSTREAM", message: "The subscription plans response was invalid." }, { status: 500, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
    }

    console.error("[plans] request=%s cause=unknown", requestId, error);
    return NextResponse.json({ success: false, requestId, code: "INTERNAL_ERROR", message: "Unable to load subscription plans." }, { status: 500, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
  }
}
