import type { Metadata } from "next";
import { prisma } from "@/infrastructure/database/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seo.findFirst({ where: { slug: "blog", status: "PUBLISHED", deletedAt: null } });
  return { title: seo?.title ?? "Phause Resources", description: seo?.description ?? undefined };
}

export default async function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { title: true, excerpt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      {children}
      <div className="sr-only">
        {posts.flatMap((post) => [post.title, post.excerpt]).join(" ")}
      </div>
    </>
  );
}
