import { NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";

export async function GET() {
  const [page, plans] = await Promise.all([
    prisma.subscriptionPage.findUnique({ where: { slug: "subscription" } }),
    prisma.subscriptionPlan.findMany({
      where: { active: true },
      include: { features: { where: { visible: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  return NextResponse.json({ success: true, page, plans });
}

export async function PUT() {
  return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
}
