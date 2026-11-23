import { prisma } from "@/infrastructure/database/prisma";
import { FooterEditor } from "@/components/cms/content-editors";
import { CmsShell } from "@/components/cms/admin-shell";

export default async function CmsFooterPage() {
  const footer = await prisma.footer.findFirst({
    where: { slug: "main-footer", deletedAt: null },
    include: { links: { where: { deletedAt: null }, orderBy: { position: "asc" }, include: { page: true } } },
  });

  const value = footer
    ? {
        title: footer.title,
        description: footer.description ?? "",
        copyright: footer.copyright ?? "",
        links: footer.links.map((link) => ({ id: link.id, pageId: link.pageId, pageTitle: link.page?.title ?? null, label: link.label, href: link.href, position: link.position, type: link.type })),
      }
    : {
        title: "Phause",
        description: "Phause delivers enterprise-grade cybersecurity solutions.",
        copyright: "© 2025 Phause. All rights reserved.",
        links: [
          { label: "Home", href: "/", position: 0 },
          { label: "About Us", href: "/about", position: 1 },
          { label: "Contact Us", href: "/contact", position: 2 },
        ],
      };

  return (
    <CmsShell title="Footer" description="Edit footer content and navigation links.">
      <FooterEditor footer={value} />
    </CmsShell>
  );
}
