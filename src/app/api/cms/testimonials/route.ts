import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/infrastructure/database/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "testimonial";
}

export async function GET() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, items: testimonials });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const quote = String(payload.quote ?? "").trim();
    const author = String(payload.author ?? "").trim();

    if (!quote || !author) {
      throw new Error("Quote and author are required");
    }

    const item = await prisma.testimonial.create({
      data: {
        slug: String(payload.slug ?? "") || slugify(author),
        quote,
        author,
        role: String(payload.role ?? "") || null,
        company: String(payload.company ?? "") || null,
        status: String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      },
    });

    const items = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, item, items });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to create testimonial" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    const id = String(payload.id ?? "").trim();
    const quote = String(payload.quote ?? "").trim();
    const author = String(payload.author ?? "").trim();

    if (!id || !quote || !author) {
      throw new Error("Testimonial id, quote, and author are required");
    }

    const item = await prisma.testimonial.update({
      where: { id },
      data: {
        slug: String(payload.slug ?? "") || slugify(author),
        quote,
        author,
        role: String(payload.role ?? "") || null,
        company: String(payload.company ?? "") || null,
        status: String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      },
    });

    const items = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, item, items });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to update testimonial" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json();
    const id = String(payload.id ?? "").trim();

    if (!id) {
      throw new Error("Testimonial id is required");
    }

    await prisma.testimonial.delete({ where: { id } });
    const items = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, items });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Unable to delete testimonial" }, { status: 400 });
  }
}
