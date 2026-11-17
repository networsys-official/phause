import { notFound } from "next/navigation";

import { prisma } from "@/infrastructure/database/prisma";
import { ensureDefaultCmsContent } from "@/features/cms/content-service";
import { CmsShell } from "@/components/cms/admin-shell";
import { PageSectionEditor } from "@/components/cms/content-editors";

export default async function CmsPageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  await ensureDefaultCmsContent();

  const page = await prisma.page.findFirst({
    where: { slug, deletedAt: null },
    include: {
      seo: true,
      blocks: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!page) {
    notFound();
  }

  const media = await prisma.media.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <CmsShell title={page.title} description={`Edit sections for the ${page.title.toLowerCase()} page.`}>
      <PageSectionEditor
        page={{
          id: page.id,
          slug: page.slug,
          title: page.title,
          status: page.status,
        }}
        blocks={page.blocks.map((block) => ({
          id: block.id,
          type: block.type,
          order: block.order,
          props: (block.props ?? {}) as Record<string, unknown>,
        }))}
        media={media.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          mimeType: item.mimeType,
        }))}
      />
    </CmsShell>
  );
}
