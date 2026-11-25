import type { Metadata } from "next";
import { prisma } from "@/infrastructure/database/prisma";
import LegacyServicesPage from "./../legacy-routes/services";

async function loadPage() { return prisma.page.findFirst({ where: { slug: "services", status: "PUBLISHED", deletedAt: null }, include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } } }); }
function cmsText(node: unknown, out: string[] = []): string[] { if (typeof node === "string") { if (node.trim()) out.push(node.trim()); } else if (Array.isArray(node)) node.forEach((item) => cmsText(item, out)); else if (node && typeof node === "object") Object.values(node).forEach((item) => cmsText(item, out)); return out; }
export async function generateMetadata(): Promise<Metadata> { const page = await loadPage(); return { title: page?.seo?.title ?? "Services", description: page?.seo?.description ?? undefined }; }
export default async function ServicesPage() { const page = await loadPage(); return <><LegacyServicesPage /><div className="sr-only">{cmsText(page?.blocks.map((block) => block.props)).join(" ")}</div></>; }
