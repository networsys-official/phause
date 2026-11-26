import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";

export async function GET() {
  const items = await prisma.navigation.findMany({
    where: { deletedAt: null },
    include: { items: { where: { deletedAt: null }, orderBy: { position: "asc" } } },
    orderBy: { position: "asc" },
  });
  return NextResponse.json({ success: true, items });
}
