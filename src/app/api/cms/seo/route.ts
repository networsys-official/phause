import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";

const seoUpdateSchema = z.object({
  id: z.string().optional(),
  slug: z.string().trim().min(1, "Address is required.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  title: z.string().trim().max(60, "Page title should be 60 characters or fewer.").nullable().optional(),
  description: z.string().trim().max(160, "Description should be 160 characters or fewer.").nullable().optional(),
  keywords: z.string().trim().max(300, "Keywords should be 300 characters or fewer.").nullable().optional(),
  canonical: z.string().trim().max(500).nullable().optional(),
});

export async function GET() {
  const entries = await prisma.seo.findMany({ where: { deletedAt: null }, orderBy: { slug: "asc" } });
  return NextResponse.json({ success: true, entries });
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  try {
    const parsed = seoUpdateSchema.parse(await request.json());
    const existing = parsed.id
      ? await prisma.seo.findFirst({ where: { id: parsed.id, deletedAt: null } })
      : await prisma.seo.findFirst({ where: { slug: parsed.slug, deletedAt: null } });
    if (!existing) return NextResponse.json({ success: false, message: "SEO entry not found." }, { status: 404 });

    const updated = await prisma.seo.update({
      where: { id: existing.id },
      data: {
        title: parsed.title ?? null,
        description: parsed.description ?? null,
        keywords: parsed.keywords ?? null,
        canonical: parsed.canonical ?? null,
        version: { increment: 1 },
      },
    });

    revalidateCmsState(parsed.slug);
    return NextResponse.json({ success: true, entry: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, message: error.issues[0]?.message ?? "Invalid SEO data.", issues: error.issues }, { status: 400 });
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "SEO save failed." }, { status: 500 });
  }
}
