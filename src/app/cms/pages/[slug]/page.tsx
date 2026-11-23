import { notFound } from "next/navigation";

import { prisma } from "@/infrastructure/database/prisma";
import { CmsShell } from "@/components/cms/admin-shell";
import { PageSectionEditor } from "@/components/cms/content-editors";
import { SubscriptionCmsEditorV2 } from "@/components/cms/subscription-cms-editor-v2";
import { PageForm } from "@/components/cms/PageForm";

export default async function CmsPageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = await prisma.page.findFirst({
    where: { slug, deletedAt: null },
    include: {
      seo: true,
      blocks: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
      navigationItems: { where: { deletedAt: null } },
      footerLinks: { where: { deletedAt: null } },
    },
  });

  if (!page) {
    notFound();
  }

  const media = await prisma.media.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  const editorProps = {
    page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      status: page.status,
      version: page.version,
      showInHeader: page.navigationItems.length > 0,
      headerLabel: page.navigationItems[0]?.label,
      headerPosition: page.navigationItems[0]?.position,
      showInFooter: page.footerLinks.length > 0,
      footerGroup: page.footerLinks[0]?.type,
      footerLabel: page.footerLinks[0]?.label,
      footerPosition: page.footerLinks[0]?.position,
    },
    blocks: page.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      order: block.order,
      props: (block.props ?? {}) as Record<string, unknown>,
    })),
    media: media.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      mimeType: item.mimeType,
    })),
  };

  return (
    <CmsShell title={page.title} description={`Edit sections for the ${page.title.toLowerCase()} page.`}>
      {page.slug !== "subscription" ? (
        <PageForm initial={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          status: page.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
          showInHeader: page.navigationItems.length > 0,
          headerLabel: page.navigationItems[0]?.label ?? page.title,
          headerPosition: page.navigationItems[0]?.position ?? 0,
          showInFooter: page.footerLinks.length > 0,
          footerGroup: page.footerLinks[0]?.type === "SERVICES" || page.footerLinks[0]?.type === "LEGAL" ? page.footerLinks[0].type : "QUICK_LINKS",
          footerLabel: page.footerLinks[0]?.label ?? page.title,
          footerPosition: page.footerLinks[0]?.position ?? 0,
          starter: "HERO_TEXT",
          seoTitle: page.seo?.title ?? page.title,
          seoDescription: page.seo?.description ?? "",
        }} existingSlugs={[]} />
      ) : null}
      {page.slug === "subscription" ? (
        <SubscriptionCmsEditorV2 />
      ) : (
        <PageSectionEditor {...editorProps} />
      )}
    </CmsShell>
  );
}
