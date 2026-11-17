import { prisma } from "@/infrastructure/database/prisma";
import { ensureDefaultCmsContent } from "@/features/cms/content-service";
import { PagesEditor } from "@/components/cms/content-editors";
import { CmsShell } from "@/components/cms/admin-shell";

export default async function CmsPagesPage() {
  await ensureDefaultCmsContent();

  const pages = await prisma.page.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
  });

  return (
    <CmsShell title="Pages" description="Manage page content and publish state across the site.">
      <PagesEditor pages={pages.map((page) => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        status: page.status,
        seo: page.seo ?? undefined,
        blocks: page.blocks.map((block) => ({
          id: block.id,
          type: block.type,
          order: block.order,
          props: (block.props ?? {}) as Record<string, unknown>,
        })),
      }))} />
    </CmsShell>
  );
}
