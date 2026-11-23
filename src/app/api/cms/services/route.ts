import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";

import { prisma } from "@/infrastructure/database/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "service";
}

export function normalizeServiceRecord(item: Record<string, unknown>) {
  return {
    ...(item ?? {}),
    description: String(item.description ?? ""),
    image: typeof item.image === "string" && item.image.trim() ? item.image.trim() : "",
  };
}

async function uniqueSlug(baseSlug: string, excludingId?: string) {
  const base = baseSlug || "service";

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const existing = await prisma.feature.findUnique({ where: { slug: candidate }, select: { id: true } });

    if (!existing || existing.id === excludingId) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

export async function GET(request: NextRequest) {
  const publishedOnly = request.nextUrl.searchParams.get("published") === "true";
  const services = await prisma.feature.findMany({
    where: publishedOnly ? { status: "PUBLISHED", deletedAt: null } : undefined,
    orderBy: { createdAt: "desc" },
  });
    return NextResponse.json({ success: true, items: services.map((item) => normalizeServiceRecord({ ...item, description: item.description ?? "" } as Record<string, unknown>)) });
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let payload: Record<string, unknown>;

    revalidateCmsState();
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      payload = await request.json();
    }

    const title = String(payload.title ?? "").trim();
    const description = String(payload.description ?? "").trim();
    const image = typeof payload.image === "string" && payload.image.trim() ? payload.image.trim() : null;

    if (!title) {
      throw new Error("Service title is required");
    }

    const slug = slugify(String(payload.slug ?? "") || title);
    const uniqueSlugValue = await uniqueSlug(slug);

    const item = await prisma.feature.create({
      data: {
        slug: uniqueSlugValue,
        title,
        description: description || "",
        image,
        status: String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      },
    });

    const items = await prisma.feature.findMany({ orderBy: { createdAt: "desc" } });
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      return NextResponse.redirect(new URL("/studio/services#create-resource-form", request.url));
    }
    return NextResponse.json({ success: true, item: normalizeServiceRecord(item as Record<string, unknown>), items: items.map((service) => normalizeServiceRecord(service as Record<string, unknown>)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to create service" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let payload: Record<string, unknown>;

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      payload = await request.json();
    }

    const id = String(payload.id ?? "").trim();
    const title = String(payload.title ?? "").trim();
    const description = String(payload.description ?? "").trim();
    const image = typeof payload.image === "string" && payload.image.trim() ? payload.image.trim() : null;

    if (!id || !title) {
      throw new Error("Service id and title are required");
    }

    const slug = slugify(String(payload.slug ?? "") || title);
    const uniqueSlugValue = await uniqueSlug(slug, id);

    const item = await prisma.feature.update({
      where: { id },
      data: {
        slug: uniqueSlugValue,
        title,
        description: description || "",
        image,
        status: String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      },
    });

    const items = await prisma.feature.findMany({ orderBy: { createdAt: "desc" } });
    revalidateCmsState();
    return NextResponse.json({ success: true, item: normalizeServiceRecord(item as Record<string, unknown>), items: items.map((service) => normalizeServiceRecord(service as Record<string, unknown>)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to update service" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  try {
    const payload = await request.json();
    const id = String(payload.id ?? "").trim();

    if (!id) {
      throw new Error("Service id is required");
    }

    await prisma.feature.delete({ where: { id } });
    revalidateCmsState();
    const items = await prisma.feature.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, items: items.map((service) => normalizeServiceRecord(service as Record<string, unknown>)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to delete service" }, { status: 400 });
  }
}
