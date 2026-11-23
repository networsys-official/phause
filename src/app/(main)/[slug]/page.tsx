import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/infrastructure/database/prisma";
import { normalizeBlockType } from "@/features/cms/cms-service";
import { DynamicPageRenderer } from "@/features/cms/dynamic-page-renderer";

async function loadPublishedPage(slug: string) {
  return prisma.page.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED" },
    include: {
      seo: true,
      blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPublishedPage(slug);
  if (!page) return { title: "Page not found" };

  const title = page.seo?.title ?? page.title;
  const description = page.seo?.description ?? undefined;
  return { title, description, alternates: page.seo?.canonical ? { canonical: page.seo.canonical } : undefined };
}

export default async function DynamicCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await loadPublishedPage(slug);
  if (!page) notFound();

  return (
    <DynamicPageRenderer
      page={{
        id: page.id,
        slug: page.slug,
        title: page.title,
        status: page.status,
        seo: page.seo ?? undefined,
        blocks: page.blocks.map((block) => ({
          id: block.id,
          type: normalizeBlockType(block.type),
          order: block.order,
          props: block.props as Record<string, unknown>,
        })),
      }}
    />
  );
}
