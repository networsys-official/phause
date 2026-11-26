import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";

export async function GET() {
  const items = await prisma.footer.findMany({
    where: { deletedAt: null },
    include: { links: { where: { deletedAt: null }, orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, items });
}
