import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";

import { prisma } from "@/infrastructure/database/prisma";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`cms-forms:${key}`, 120, 60_000);

  if (!rateLimit.allowed) {
    revalidateCmsState();
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  const forms = await prisma.form.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, forms });
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const slug = String((body as { slug?: string }).slug ?? (body as { name?: string }).name ?? "untitled-form");
    const payload = body as { slug?: string; name?: string; fields?: unknown[]; status?: string };
    const status = typeof payload.status === "string" ? (payload.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED") : "PUBLISHED";
    const form = await prisma.form.create({
      data: {
        slug,
        name: String(payload.name ?? "Untitled form"),
        fields: Array.isArray(payload.fields) ? (payload.fields as Prisma.InputJsonValue) : [],
        status,
        version: 1,
      },
    });

    return NextResponse.json({ success: true, form }, { status: 201 });
  } catch (error) {
    logger.error("Form creation failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Form creation failed." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String((body as { id?: string }).id ?? "");
    const slug = String((body as { slug?: string }).slug ?? "");

    const payload = body as { id?: string; slug?: string; name?: string; fields?: unknown[]; status?: string };
    const status = typeof payload.status === "string" ? (payload.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED") : "PUBLISHED";
    const form = await prisma.form.upsert({
      where: { slug: slug || id || "untitled-form" },
      update: {
        name: String(payload.name ?? "Untitled form"),
        fields: Array.isArray(payload.fields) ? (payload.fields as Prisma.InputJsonValue) : [],
        status,
        version: { increment: 1 },
      },
      create: {
        slug: slug || String(payload.name ?? "untitled-form"),
        name: String(payload.name ?? "Untitled form"),
        fields: Array.isArray(payload.fields) ? (payload.fields as Prisma.InputJsonValue) : [],
        status,
        version: 1,
      },
    });

    return NextResponse.json({ success: true, form });
  } catch (error) {
    logger.error("Form update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Form update failed." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = String((body as { id?: string }).id ?? "");
    const slug = String((body as { slug?: string }).slug ?? "");

    if (!id && !slug) {
      return NextResponse.json({ success: false, message: "Form id or slug is required." }, { status: 400 });
    }

    const form = await prisma.form.update({
      where: id ? { id } : { slug },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });

    return NextResponse.json({ success: true, form });
  } catch (error) {
    logger.error("Form delete failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Form delete failed." }, { status: 500 });
  }
}
