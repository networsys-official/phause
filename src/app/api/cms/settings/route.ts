import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";

import { prisma } from "@/infrastructure/database/prisma";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET() {
  const settings = await prisma.setting.findMany({
    where: { deletedAt: null },
    orderBy: { key: "asc" },
  });

  revalidateCmsState();
    return NextResponse.json({ success: true, settings });
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const entries = Array.isArray(body.settings) ? body.settings : [body];

    const saved = await Promise.all(
      entries.map(async (entry: Record<string, unknown>) => {
        const key = String(entry.key ?? entry.slug ?? "site_setting");
        const slug = String(entry.slug ?? key);
        const value = typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value ?? "");

        const status = typeof entry.status === "string" ? (entry.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED") : "PUBLISHED";
        const record = await prisma.setting.upsert({
          where: { key },
          update: {
            slug,
            value,
            status,
            version: { increment: 1 },
          },
          create: {
            slug,
            key,
            value,
            status,
            version: 1,
          },
        });

        return record;
      }),
    );

    return NextResponse.json({ success: true, settings: saved }, { status: 201 });
  } catch (error) {
    logger.error("Settings update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Settings update failed." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  return POST(request);
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const key = String((body as { key?: string }).key ?? "");
    const id = String((body as { id?: string }).id ?? "");

    if (!key && !id) {
      return NextResponse.json({ success: false, message: "Setting key or id is required." }, { status: 400 });
    }

    const where = id ? { id } : { key };
    const record = await prisma.setting.update({
      where,
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });

    return NextResponse.json({ success: true, setting: record });
  } catch (error) {
    logger.error("Setting delete failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Setting delete failed." }, { status: 500 });
  }
}
