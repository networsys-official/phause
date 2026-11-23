import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";

import { prisma } from "@/infrastructure/database/prisma";
import { normalizeSlug } from "@/features/cms/cms-service";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`media:${key}`, 120, 60_000);

  if (!rateLimit.allowed) {
    revalidateCmsState();
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  const mediaRecords = await prisma.media.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    success: true,
    media: mediaRecords.map((item) => ({
      id: item.id,
      title: item.title,
      altText: item.altText ?? "Phause media asset",
      caption: item.caption ?? item.title,
      url: item.url,
      width: item.width ?? 1200,
      height: item.height ?? 400,
      mimeType: item.mimeType,
      size: item.size ?? 0,
      tags: item.tags ?? ["brand"],
    })),
  });
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const title = String(payload.title ?? "Untitled media");
    const url = String(payload.url ?? "/logo/phause-logo.png");
    const mimeType = String(payload.mimeType ?? "image/png");

    const media = await prisma.media.upsert({
      where: { slug: normalizeSlug(title) },
      update: {
        title,
        filename: String(payload.filename ?? title),
        mimeType,
        url,
        altText: payload.altText ? String(payload.altText) : title,
        caption: payload.caption ? String(payload.caption) : title,
        size: payload.size ? Number(payload.size) : 0,
        status: "PUBLISHED",
      },
      create: {
        slug: normalizeSlug(title),
        title,
        filename: String(payload.filename ?? title),
        mimeType,
        url,
        altText: payload.altText ? String(payload.altText) : title,
        caption: payload.caption ? String(payload.caption) : title,
        size: payload.size ? Number(payload.size) : 0,
        status: "PUBLISHED",
        version: 1,
      },
    });

    logger.info("Media upload processed", { title, id: media.id });
    return NextResponse.json({ success: true, media }, { status: 201 });
  } catch (error) {
    logger.error("Media upload failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Media upload failed." }, { status: 500 });
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
    const id = String((body as { id?: string }).id ?? request.nextUrl.searchParams.get("id") ?? "");

    if (!id) {
      return NextResponse.json({ success: false, message: "Media id is required." }, { status: 400 });
    }

    const media = await prisma.media.update({
      where: { id },
      data: { deletedAt: new Date(), status: "ARCHIVED", updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, media });
  } catch (error) {
    logger.error("Media delete failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Media delete failed." }, { status: 500 });
  }
}
