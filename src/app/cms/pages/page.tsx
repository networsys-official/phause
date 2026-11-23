import { prisma } from "@/infrastructure/database/prisma";
import { PagesEditor } from "@/components/cms/content-editors";
import { CmsShell } from "@/components/cms/admin-shell";

export default async function CmsPagesPage() {
  const pages = await prisma.page.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      seo: true,
      blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } },
      navigationItems: { where: { deletedAt: null } },
      footerLinks: { where: { deletedAt: null } },
    },
  });

  return (
    <CmsShell title="Pages" description="Manage page content and publish state across the site.">
      <PagesEditor
        pages={pages.map((page) => ({
          id: page.id,
          slug: page.slug,
          title: page.title,
          status: page.status,
          seo: page.seo ?? undefined,
          showInHeader: page.navigationItems.length > 0,
          headerLabel: page.navigationItems[0]?.label,
          headerPosition: page.navigationItems[0]?.position,
          showInFooter: page.footerLinks.length > 0,
          footerGroup: page.footerLinks[0]?.type,
          footerLabel: page.footerLinks[0]?.label,
          footerPosition: page.footerLinks[0]?.position,
          blocks: page.blocks.map((block) => ({
            id: block.id,
            type: block.type,
            order: block.order,
            props: (block.props ?? {}) as Record<string, unknown>,
          })),
        }))}
      />
    </CmsShell>
  );
}
