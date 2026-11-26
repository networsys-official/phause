import { NextRequest, NextResponse } from "next/server";

import { hasCmsRequestAccess } from "@/lib/cms-access";
import { prisma } from "@/infrastructure/database/prisma";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

// 404 handler for removed CMS leads endpoints
export async function GET() {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, items: leads });
}
