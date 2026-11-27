import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";

// 404 handler for removed CMS leads endpoints
export async function GET() {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, items: leads });
}
