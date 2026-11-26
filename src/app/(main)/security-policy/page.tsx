import type { Metadata } from "next";
import { prisma } from "@/infrastructure/database/prisma";
import { normalizeBlockType } from "@/features/cms/cms-service";
import { DynamicPageRenderer } from "@/features/cms/dynamic-page-renderer";

async function loadPage() { return prisma.page.findFirst({ where: { slug: "security-policy", status: "PUBLISHED", deletedAt: null }, include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } } }); }
export async function generateMetadata(): Promise<Metadata> { const page = await loadPage(); return { title: page?.seo?.title ?? "Security Policy", description: page?.seo?.description ?? undefined }; }
export default async function SecurityPolicyPage() { const page = await loadPage(); if (!page) return null; return <DynamicPageRenderer page={{ id: page.id, slug: page.slug, title: page.title, status: page.status, seo: page.seo ?? undefined, blocks: page.blocks.map((block) => ({ id: block.id, type: normalizeBlockType(block.type), order: block.order, props: block.props as Record<string, unknown> })) }} />; }
