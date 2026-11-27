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

async function loadServicesBlock() {
  const page = await prisma.page.findFirst({
    where: { slug: "services", deletedAt: null },
    include: { blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
  });
  const block = page?.blocks.find((entry) => /^(SERVICES_FEATURES|SERVICES)$/i.test(String(entry.type)))
    ?? page?.blocks.find((entry) => /service.*feature/i.test(String(entry.type)));
  const props = (block?.props ?? {}) as Record<string, unknown>;
  const items = Array.isArray(props.items) ? props.items as Array<Record<string, unknown>> : [];
  return { page, block, props, items };
}

async function saveServices(items: Array<Record<string, unknown>>) {
  const { page, block, props } = await loadServicesBlock();
  if (!page) throw new Error("Services page not found.");
  if (block) {
    await prisma.pageBlock.update({ where: { id: block.id }, data: { props: { ...props, items } as never, version: { increment: 1 } } });
  } else {
    await prisma.pageBlock.create({ data: { pageId: page.id, type: "SERVICES_FEATURES", order: 1, props: { items } as never, version: 1 } });
  }
}

export async function GET(request: NextRequest) {
  const publishedOnly = request.nextUrl.searchParams.get("published") === "true";
  const { items } = await loadServicesBlock();
  const visible = publishedOnly ? items.filter((item) => String(item.status ?? "PUBLISHED").toUpperCase() === "PUBLISHED") : items;
  return NextResponse.json({ success: true, items: visible.map((item, index) => ({ id: String(item.id ?? `service-${index + 1}`), slug: String(item.slug ?? slugify(String(item.title ?? "service"))), title: String(item.title ?? ""), description: String(item.description ?? ""), image: String(item.image ?? ""), status: String(item.status ?? "PUBLISHED") })) });
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request); if (accessError) return accessError;
  try {
    const payload = await request.json();
    const { items } = await loadServicesBlock();
    const title = String(payload.title ?? "").trim(); if (!title) throw new Error("Service title is required");
    const item = { id: crypto.randomUUID(), slug: slugify(String(payload.slug ?? title)), title, description: String(payload.description ?? "").trim(), image: typeof payload.image === "string" ? payload.image : "", status: String(payload.status ?? "PUBLISHED").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT" };
    await saveServices([...items, item]); revalidateCmsState("services");
    return NextResponse.json({ success: true, item, items: [...items, item] });
  } catch (error) { return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to create service" }, { status: 400 }); }
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request); if (accessError) return accessError;
  try {
    const payload = await request.json();
    const id = String(payload.id ?? ""); if (!id) throw new Error("Service id is required");
    const { items } = await loadServicesBlock();
    const updated = items.map((item, index) => String(item.id ?? `service-${index + 1}`) === id ? { ...item, slug: slugify(String(payload.slug ?? payload.title ?? item.title)), title: String(payload.title ?? item.title ?? ""), description: String(payload.description ?? item.description ?? ""), image: typeof payload.image === "string" ? payload.image : String(item.image ?? ""), status: String(payload.status ?? item.status ?? "PUBLISHED").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT" } : item);
    await saveServices(updated); revalidateCmsState("services");
    return NextResponse.json({ success: true, items: updated });
  } catch (error) { return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to update service" }, { status: 400 }); }
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request); if (accessError) return accessError;
  try {
    const payload = await request.json(); const id = String(payload.id ?? ""); if (!id) throw new Error("Service id is required");
    const { items } = await loadServicesBlock();
    const updated = items.filter((item, index) => String(item.id ?? `service-${index + 1}`) !== id);
    await saveServices(updated); revalidateCmsState("services");
    return NextResponse.json({ success: true, items: updated });
  } catch (error) { return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to delete service" }, { status: 400 }); }
}

export function normalizeServiceRecord(item: Record<string, unknown>) {
  return {
    ...item,
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    image: typeof item.image === "string" ? item.image : "",
  };
}
