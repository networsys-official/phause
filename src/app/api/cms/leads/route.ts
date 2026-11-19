import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`cms-leads:${key}`, 120, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  const search = request.nextUrl.searchParams.get("search") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "ALL";

  const leadStatuses = ["NEW", "ASSIGNED", "QUALIFIED", "CONTACTED", "MEETING_SCHEDULED", "PROPOSAL_SENT", "CLOSED_WON", "CLOSED_LOST", "SPAM"] as const;
  const statusFilter = leadStatuses.includes(status as typeof leadStatuses[number]) ? { status: status as typeof leadStatuses[number] } : {};
  const leadRecords = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      ...statusFilter,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
              { message: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  console.info("LEADS_FETCH_COUNT", { count: leadRecords.length });
  return NextResponse.json({ success: true, leads: leadRecords });
}

export async function PUT(request: NextRequest) {
  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String((body as { id?: string }).id ?? "");
    if (!id) {
      return NextResponse.json({ success: false, message: "Lead id is required." }, { status: 400 });
    }

    const payload = body as { status?: string; assignedTo?: string };
    const leadStatuses = ["NEW", "ASSIGNED", "QUALIFIED", "CONTACTED", "MEETING_SCHEDULED", "PROPOSAL_SENT", "CLOSED_WON", "CLOSED_LOST", "SPAM"] as const;

    if (!leadStatuses.includes(payload.status as typeof leadStatuses[number])) {
      return NextResponse.json({ success: false, message: "Invalid lead status." }, { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        status: payload.status as typeof leadStatuses[number],
        assignedTo: typeof payload.assignedTo === "string" ? payload.assignedTo.trim() || null : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    logger.error("Lead update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Lead update failed." }, { status: 500 });
  }
}
