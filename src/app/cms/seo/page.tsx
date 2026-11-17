import { prisma } from "@/infrastructure/database/prisma";
import { SeoEditor } from "@/components/cms/content-editors";
import { CmsShell } from "@/components/cms/admin-shell";

export default async function CmsSeoPage() {
  const entries = await prisma.seo.findMany({
    where: { deletedAt: null },
    orderBy: { slug: "asc" },
  });

  return (
    <CmsShell title="SEO" description="Update metadata and canonical details for public pages.">
      <SeoEditor entries={entries.map((entry) => ({
        slug: entry.slug,
        title: entry.title,
        description: entry.description,
        keywords: entry.keywords,
        canonical: entry.canonical,
      }))} />
    </CmsShell>
  );
}
