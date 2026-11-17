import { prisma } from "@/infrastructure/database/prisma";
import { SettingsEditor } from "@/components/cms/content-editors";
import { ensureDefaultCmsContent } from "@/features/cms/content-service";
import { CmsShell } from "@/components/cms/admin-shell";

const requiredSettings = [
  { key: "siteName", value: "Phause" },
  { key: "timezone", value: "UTC" },
  { key: "publishingMode", value: "Draft + publish" },
  { key: "cmsApiEnabled", value: "true" },
  { key: "mediaPipelineEnabled", value: "true" },
  { key: "seoSyncEnabled", value: "true" },
  { key: "supportEmail", value: "hello@phause.com" },
  { key: "supportPhone", value: "+1 (555) 010-PHAUSE" },
  { key: "logoUrl", value: "/logo/phause-logo.png" },
] as const;

export default async function CmsSettingsPage() {
  await ensureDefaultCmsContent();

  const existingSettings = await prisma.setting.findMany({
    where: { deletedAt: null },
    orderBy: { key: "asc" },
  });

  const existingKeys = new Set(existingSettings.map((setting) => setting.key));

  for (const entry of requiredSettings) {
    if (!existingKeys.has(entry.key)) {
      await prisma.setting.upsert({
        where: { key: entry.key },
        update: {
          value: entry.value,
          status: "PUBLISHED",
          version: { increment: 1 },
        },
        create: {
          key: entry.key,
          slug: entry.key,
          value: entry.value,
          status: "PUBLISHED",
          version: 1,
        },
      });
    }
  }

  const settings = await prisma.setting.findMany({
    where: { deletedAt: null },
    orderBy: { key: "asc" },
  });

  return (
    <CmsShell title="Settings" description="Adjust global site settings and configuration.">
      <SettingsEditor
        settings={settings.map((setting) => ({
          id: setting.id,
          key: setting.key,
          slug: setting.slug,
          value: setting.value,
          status: setting.status,
        }))}
      />
    </CmsShell>
  );
}
