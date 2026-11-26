import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";

export async function GET() {
  const items = await prisma.media.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, items });
}
