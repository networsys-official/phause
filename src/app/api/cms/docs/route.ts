import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";

export async function GET() {
  const items = await prisma.page.findMany({
    where: { slug: "docs", deletedAt: null },
    include: { blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ success: true, items });
}
