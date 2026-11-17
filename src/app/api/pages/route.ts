import { NextRequest, NextResponse } from "next/server";

import { ensureDefaultCmsContent, getPageBySlug } from "@/features/cms/content-service";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`pages:${key}`, 120, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  await ensureDefaultCmsContent();

  const pageSlug = request.nextUrl.searchParams.get("slug") ?? "home";
  const page = await getPageBySlug(pageSlug);

  return NextResponse.json({ success: true, page });
}

export async function POST(request: NextRequest) {
  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    logger.info("Page create request received", { slug: payload.slug ?? "unknown" });

    return NextResponse.json({ success: true, data: payload }, { status: 201 });
  } catch (error) {
    logger.error("Failed to create page", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Page creation failed." }, { status: 500 });
  }
}
