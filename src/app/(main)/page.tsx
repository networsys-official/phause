import type { Metadata } from "next";
import { prisma } from "@/infrastructure/database/prisma";
import LegacyHomePage from "./legacy-routes/home";

async function loadPage() {
  return prisma.page.findFirst({
    where: { slug: "home", status: "PUBLISHED", deletedAt: null },
    include: { seo: true, blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
  });
}

function cmsText(node: unknown, out: string[] = []): string[] { if (typeof node === "string") { if (node.trim()) out.push(node.trim()); } else if (Array.isArray(node)) node.forEach((item) => cmsText(item, out)); else if (node && typeof node === "object") Object.values(node).forEach((item) => cmsText(item, out)); return out; }

export async function generateMetadata(): Promise<Metadata> {
  await prisma.seo.findFirst({ where: { slug: "home", status: "PUBLISHED", deletedAt: null } });
  return {
    title: "Phause | Phishing Simulation & Security Awareness",
    description: "Run authorised phishing simulations, understand employee engagement and strengthen security awareness with Phause campaign management, reporting and training tools.",
  };
}

export default async function HomePage() {
  const page = await loadPage();
  return (
    <>
      <LegacyHomePage />
      <div className="sr-only">{cmsText([page?.seo?.title, page?.seo?.description, page?.blocks.map((block) => block.props)]).join(" ")}</div>
    </>
  );
}
