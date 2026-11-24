export const dynamic = "force-dynamic";

import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { getBlockProp } from "@/features/cms/page-builder";
import { blogPosts, getBlogPost } from "@/lib/blog";

type BlogDetailProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  const ogImage = post?.ogImage ?? post?.featuredImage ?? post?.image ?? "/logo/phause-logo.png";

  return {
    title: post ? `${post.title} | Phause Blog` : "Phause Blog",
    description: post?.excerpt ?? "Phause blog",
    openGraph: {
      title: post ? post.title : "Phause Blog",
      description: post?.excerpt ?? "Phause blog",
      images: [{ url: ogImage, alt: post?.imageAlt ?? post?.title ?? "Phause blog image" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post ? post.title : "Phause Blog",
      description: post?.excerpt ?? "Phause blog",
      images: [ogImage],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: BlogDetailProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  const cmsPage = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/cms/pages?slug=blog`, { cache: "no-store" }).then((response) => response.ok ? response.json() : { page: null }).catch(() => ({ page: null }));
  const pageBlocks = Array.isArray(cmsPage.page?.blocks) ? cmsPage.page.blocks : [];
  const heroBlock = pageBlocks.find((block: Record<string, unknown>) => String((block.type ?? "")).toLowerCase() === "hero")?.props as Record<string, unknown> | undefined;

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts
    .filter(
      (item) =>
        item.slug !== post.slug && item.category === post.category
    )
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-[#081522] text-white">
      {/* Article hero */}
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-16 pt-20 md:pb-24 md:pt-28">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />

        <div className="relative mx-auto max-w-5xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"
          >
            <ArrowLeft size={17} />
            Back to blog
          </Link>

          <div className="mt-10">
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-300">
              {getBlockProp(heroBlock ?? {}, "eyebrow", post.category)}
            </span>

            <h1 className="mt-6 text-3xl font-bold leading-tight md:text-5xl">
              {post.title}
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-400 md:text-lg">
              {post.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <CalendarDays size={16} />
                {post.date}
              </span>
              <span className="flex items-center gap-2">
                <Clock3 size={16} />
                {post.readTime}
              </span>
              <span>By {post.author}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Article image */}
      <section className="px-6 pt-12">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10">
          <Image
            src={post.featuredImage ?? post.image}
            alt={post.imageAlt ?? post.title}
            width={1600}
            height={900}
            priority
            className="h-[280px] w-full object-cover md:h-[500px]"
          />
        </div>
      </section>

      {/* Article content */}
      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_280px]">
          <article>
            <div className="space-y-7 text-base leading-8 text-slate-300">
              {post.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-12 border-t border-white/10 pt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 font-semibold text-cyan-400 transition hover:gap-3"
              >
                <ArrowLeft size={17} />
                Back to all articles
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="h-fit rounded-2xl border border-white/10 bg-[#101f2e] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              About Phause
            </p>

            <h3 className="mt-4 text-xl font-bold">
              Technology that works for your business.
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              Discover how the right technology, support and solutions can
              help your organisation move forward.
            </p>

            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-teal-300"
            >
              Contact us <ArrowRight size={16} />
            </Link>
          </aside>
        </div>
      </section>

      {/* Related articles */}
      {relatedPosts.length > 0 && (
        <section className="border-t border-white/10 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              Keep exploring
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Related articles
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {relatedPosts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101f2e] transition hover:border-cyan-400/40"
                >
                  <Image
                    src={related.image}
                    alt={related.title}
                    width={1200}
                    height={720}
                    className="h-48 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />

                  <div className="p-6">
                    <span className="text-xs font-semibold text-cyan-400">
                      {related.category}
                    </span>
                    <h3 className="mt-3 text-xl font-bold group-hover:text-cyan-300">
                      {related.title}
                    </h3>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400">
                      Read article <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
