export const dynamic = "force-dynamic";
import { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";
import { prisma } from "@/infrastructure/database/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://phause.com";
  let pages: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    pages = await prisma.page.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
      select: { slug: true, updatedAt: true },
    });
  } catch {
    console.warn("[sitemap] database unavailable; using static routes");
  }
  return [
    { url: `${baseUrl}${ROUTES.home}`, lastModified: new Date() },
    { url: `${baseUrl}${ROUTES.about}`, lastModified: new Date() },
    ...pages.map((page) => ({ url: `${baseUrl}/${page.slug}`, lastModified: page.updatedAt })),
  ];
}

