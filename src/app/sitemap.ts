import { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";
import { prisma } from "@/infrastructure/database/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://phause.com";
  const pages = await prisma.page.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { slug: true, updatedAt: true },
  });
  return [
    { url: `${baseUrl}${ROUTES.home}`, lastModified: new Date() },
    { url: `${baseUrl}${ROUTES.about}`, lastModified: new Date() },
    ...pages.map((page) => ({ url: `${baseUrl}/${page.slug}`, lastModified: page.updatedAt })),
  ];
}

