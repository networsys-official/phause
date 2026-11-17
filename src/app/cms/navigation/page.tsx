import { prisma } from "@/infrastructure/database/prisma";
import { NavigationEditor } from "@/components/cms/content-editors";
import { CmsShell } from "@/components/cms/admin-shell";

export default async function CmsNavigationPage() {
  const navigation = await prisma.navigation.findFirst({
    where: { key: "main", deletedAt: null },
    include: { items: { where: { deletedAt: null }, orderBy: { position: "asc" } } },
  });

  const value = navigation
    ? {
        key: navigation.key,
        label: navigation.label,
        items: navigation.items.map((item) => ({ label: item.label, href: item.href, position: item.position })),
      }
    : {
        key: "main",
        label: "Main navigation",
        items: [
          { label: "Home", href: "/", position: 0 },
          { label: "About Us", href: "/about", position: 1 },
          { label: "Subscription", href: "/subscription", position: 2 },
          { label: "Contact Us", href: "/contact", position: 3 },
        ],
      };

  return (
    <CmsShell title="Navigation" description="Edit labels, URLs, and item order for the main menu.">
      <NavigationEditor navigation={value} />
    </CmsShell>
  );
}
