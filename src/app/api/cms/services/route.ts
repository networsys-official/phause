import { NextRequest, NextResponse } from "next/server";

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

export async function GET() {
  const services = await prisma.feature.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, items: services.map((item) => normalizeServiceRecord({ ...item, description: item.description ?? "" } as Record<string, unknown>)) });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const title = String(payload.title ?? "").trim();
    const description = String(payload.description ?? "").trim();
    const image = typeof payload.image === "string" && payload.image.trim() ? payload.image.trim() : null;

    if (!title) {
      throw new Error("Service title is required");
    }

    const item = await prisma.feature.create({
      data: {
        slug: String(payload.slug ?? "") || slugify(title),
        title,
        description: description || "",
        image,
        status: String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      },
    });

    const items = await prisma.feature.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, item: normalizeServiceRecord(item as Record<string, unknown>), items: items.map((service) => normalizeServiceRecord(service as Record<string, unknown>)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to create service" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    const id = String(payload.id ?? "").trim();
    const title = String(payload.title ?? "").trim();
    const description = String(payload.description ?? "").trim();
    const image = typeof payload.image === "string" && payload.image.trim() ? payload.image.trim() : null;

    if (!id || !title) {
      throw new Error("Service id and title are required");
    }

    const item = await prisma.feature.update({
      where: { id },
      data: {
        slug: String(payload.slug ?? "") || slugify(title),
        title,
        description: description || "",
        image,
        status: String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      },
    });

    const items = await prisma.feature.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, item: normalizeServiceRecord(item as Record<string, unknown>), items: items.map((service) => normalizeServiceRecord(service as Record<string, unknown>)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to update service" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json();
    const id = String(payload.id ?? "").trim();

    if (!id) {
      throw new Error("Service id is required");
    }

    await prisma.feature.delete({ where: { id } });
    const items = await prisma.feature.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, items: items.map((service) => normalizeServiceRecord(service as Record<string, unknown>)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to delete service" }, { status: 400 });
  }
}
