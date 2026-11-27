import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/database/prisma";

async function loadBlock() {
  const page = await prisma.page.findFirst({ where: { slug: "about", deletedAt: null }, include: { blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } } });
  const block = page?.blocks.find((entry) => String(entry.type).replace(/[_-]+/g, "").toLowerCase() === "testimonial");
  const props = (block?.props ?? {}) as Record<string, unknown>;
  return { page, block, props, items: Array.isArray(props.items) ? props.items as Array<Record<string, unknown>> : [] };
}

async function saveItems(items: Array<Record<string, unknown>>) {
  const { page, block } = await loadBlock();
  if (!page || !block) throw new Error("About testimonial block not found.");
  await prisma.pageBlock.update({ where: { id: block.id }, data: { props: { ...(block.props as Record<string, unknown>), items } as never, version: { increment: 1 } } });
}

export async function GET() {
  const data = await loadBlock();
  const items = data.items.map((item, index) => ({ id: String(item.id ?? `testimonial-${index + 1}`), slug: String(item.slug ?? `testimonial-${index + 1}`), author: String(item.name ?? item.author ?? ""), role: String(item.role ?? ""), company: String(item.company ?? ""), quote: String(item.text ?? item.quote ?? ""), stars: Number(item.stars ?? 5), status: "PUBLISHED" }));
  return NextResponse.json({ success: true, items });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = await loadBlock();
    const item = { id: crypto.randomUUID(), slug: String(payload.slug ?? ""), name: String(payload.author ?? ""), role: String(payload.role ?? ""), company: String(payload.company ?? ""), text: String(payload.quote ?? ""), stars: Number(payload.stars ?? 5) };
    await saveItems([...data.items, item]);
    return NextResponse.json({ success: true, item, items: [item] });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to create testimonial" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = await loadBlock();
    const items = data.items.map((item) => String(item.id ?? "") === String(payload.id ?? "") ? { ...item, name: String(payload.author ?? item.name ?? ""), role: String(payload.role ?? item.role ?? ""), company: String(payload.company ?? item.company ?? ""), text: String(payload.quote ?? item.text ?? ""), stars: Number(payload.stars ?? item.stars ?? 5) } : item);
    await saveItems(items);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to update testimonial" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = await loadBlock();
    const items = data.items.filter((item, index) => String(item.id ?? `testimonial-${index + 1}`) !== String(payload.id ?? ""));
    await saveItems(items);
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to delete testimonial" }, { status: 400 });
  }
}
