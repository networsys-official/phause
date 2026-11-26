import { prisma } from "@/infrastructure/database/prisma";

export const publicSettingDefaults = {
  siteName: "Phause",
  timezone: "UTC",
  publishingMode: "Draft + publish",
  cmsApiEnabled: true,
  mediaPipelineEnabled: true,
  seoSyncEnabled: true,
  supportEmail: "hello@phause.com",
  supportPhone: "",
  logoUrl: "/logo/phause-logo.png",
} as const;

export async function getPublishedSettings() {
  const keys = Object.keys(publicSettingDefaults);
  let settings: Array<{ key: string; value: string }> = [];
  try {
    settings = await prisma.setting.findMany({
      where: { key: { in: keys }, status: "PUBLISHED", deletedAt: null },
    });
  } catch (error) {
    console.warn("[settings] published settings unavailable; using defaults", error instanceof Error ? error.name : "database error");
  }

  const values: Record<string, string> = {};
  for (const setting of settings) values[setting.key] = setting.value;

  return {
    siteName: values.siteName || publicSettingDefaults.siteName,
    timezone: values.timezone || publicSettingDefaults.timezone,
    publishingMode: values.publishingMode || publicSettingDefaults.publishingMode,
    cmsApiEnabled: (values.cmsApiEnabled ?? String(publicSettingDefaults.cmsApiEnabled)) === "true",
    mediaPipelineEnabled: (values.mediaPipelineEnabled ?? String(publicSettingDefaults.mediaPipelineEnabled)) === "true",
    seoSyncEnabled: (values.seoSyncEnabled ?? String(publicSettingDefaults.seoSyncEnabled)) === "true",
    supportEmail: values.supportEmail || publicSettingDefaults.supportEmail,
    supportPhone: values.supportPhone || publicSettingDefaults.supportPhone,
    logoUrl: values.logoUrl || publicSettingDefaults.logoUrl,
  };
}
