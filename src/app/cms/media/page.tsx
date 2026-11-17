import { prisma } from "@/infrastructure/database/prisma";
import { MediaEditor } from "@/components/cms/content-editors";
import { CmsShell } from "@/components/cms/admin-shell";

export default async function CmsMediaPage() {
  const media = await prisma.media.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <CmsShell title="Media" description="Upload, replace, and manage website media assets.">
      <MediaEditor media={media.map((item) => ({
        id: item.id,
        title: item.title,
        altText: item.altText,
        caption: item.caption,
        url: item.url,
        mimeType: item.mimeType,
        size: item.size,
        width: item.width,
        height: item.height,
        tags: item.tags,
      }))} />
    </CmsShell>
  );
}
