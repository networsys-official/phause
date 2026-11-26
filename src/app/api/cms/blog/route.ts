import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";

import { fallbackBlogPosts } from "@/lib/blog";
import { prisma } from "@/infrastructure/database/prisma";

const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "post";
}

function getMediaReference(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const media = value as Record<string, unknown>;
  if (typeof media.id === "string" && media.id.trim()) {
    return { id: media.id, url: typeof media.url === "string" ? media.url : undefined, altText: typeof media.altText === "string" ? media.altText : undefined, mimeType: typeof media.mimeType === "string" ? media.mimeType : undefined, size: typeof media.size === "number" ? media.size : Number(media.size ?? 0) };
  }

  if (typeof media.url === "string" && media.url.trim()) {
    return { id: undefined, url: media.url, altText: typeof media.altText === "string" ? media.altText : undefined, mimeType: typeof media.mimeType === "string" ? media.mimeType : undefined, size: typeof media.size === "number" ? media.size : Number(media.size ?? 0) };
  }

  return null;
}

function validateMediaAsset(fieldName: string, value: unknown) {
  const media = getMediaReference(value);
  if (!media) {
    return null;
  }

  const mimeType = media.mimeType ?? "image/png";
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType) && !ALLOWED_IMAGE_MIME_TYPES.has(mimeType.toLowerCase())) {
    throw new Error(`❌ Invalid image format for ${fieldName}`);
  }

  const size = Number(media.size ?? 0);
  if (size > MAX_IMAGE_BYTES) {
    throw new Error(`❌ File exceeds 10MB for ${fieldName}`);
  }

  return media;
}

function normalizePost(payload: Record<string, unknown>) {
  const title = String(payload.title ?? "").trim();
  const rawSlug = String(payload.slug ?? "").trim();
  const excerpt = String(payload.excerpt ?? "").trim();
  const body = String(payload.body ?? "").trim();
  const imageAlt = String(payload.imageAlt ?? "").trim();

  if (!title) {
    throw new Error("Title is required");
  }

  const status = (String(payload.status ?? "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT";

  return {
    id: payload.id ? String(payload.id) : undefined,
    title,
    slug: rawSlug || slugify(title),
    excerpt: excerpt || title,
    body: body || excerpt || title,
    imageAlt: imageAlt || title,
    status,
    featuredImage: validateMediaAsset("featured image", payload.featuredImage ?? null),
    thumbnailImage: validateMediaAsset("thumbnail image", payload.thumbnailImage ?? null),
    ogImage: validateMediaAsset("OG image", payload.ogImage ?? null),
  };
}

async function resolveMediaId(mediaRef: { id?: string; url?: string; altText?: string; mimeType?: string } | null, fieldName: string) {
  if (!mediaRef) {
    return null;
  }

  if (mediaRef.id) {
    const exists = await prisma.media.findUnique({ where: { id: mediaRef.id } });
    if (!exists) {
      throw new Error(`❌ Image not found for ${fieldName}`);
    }
    return mediaRef.id;
  }

  if (mediaRef.url) {
    const inferredMime = mediaRef.mimeType ?? "image/png";
    if (!ALLOWED_IMAGE_MIME_TYPES.has(inferredMime) && !ALLOWED_IMAGE_MIME_TYPES.has(inferredMime.toLowerCase())) {
      throw new Error(`❌ Invalid image format for ${fieldName}`);
    }

    const created = await prisma.media.create({
      data: {
        slug: slugify(`${fieldName}-${Date.now()}`),
        title: fieldName,
        filename: `${fieldName}-${Date.now()}.png`,
        mimeType: inferredMime,
        url: mediaRef.url,
        altText: mediaRef.altText || fieldName,
        size: 0,
        status: "PUBLISHED",
        version: 1,
      },
    });

    return created.id;
  }

  return null;
}

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        body: true,
        status: true,
        createdAt: true,
        imageAlt: true,
        featuredImage: { select: { id: true, url: true, altText: true, mimeType: true, size: true } },
        thumbnailImage: { select: { id: true, url: true, altText: true, mimeType: true, size: true } },
        ogImage: { select: { id: true, url: true, altText: true, mimeType: true, size: true } },
      },
    });

    return NextResponse.json({
      success: true,
      items: posts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        body: post.body ?? "",
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        imageAlt: post.imageAlt ?? post.title,
        featuredImage: post.featuredImage
          ? { id: post.featuredImage.id, url: post.featuredImage.url, altText: post.featuredImage.altText ?? post.title, mimeType: post.featuredImage.mimeType, size: post.featuredImage.size ?? 0 }
          : null,
        thumbnailImage: post.thumbnailImage
          ? { id: post.thumbnailImage.id, url: post.thumbnailImage.url, altText: post.thumbnailImage.altText ?? post.title, mimeType: post.thumbnailImage.mimeType, size: post.thumbnailImage.size ?? 0 }
          : null,
        ogImage: post.ogImage
          ? { id: post.ogImage.id, url: post.ogImage.url, altText: post.ogImage.altText ?? post.title, mimeType: post.ogImage.mimeType, size: post.ogImage.size ?? 0 }
          : null,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to load blog posts",
      items: [],
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  try {
    const payload = await request.json();
    const nextPost = normalizePost(payload);

    const created = await prisma.post.create({
      data: {
        title: nextPost.title,
        slug: nextPost.slug,
        excerpt: nextPost.excerpt,
        body: nextPost.body,
        imageAlt: nextPost.imageAlt,
        status: nextPost.status,
        featuredImageId: await resolveMediaId(nextPost.featuredImage, "featured image"),
        thumbnailImageId: await resolveMediaId(nextPost.thumbnailImage, "thumbnail image"),
        ogImageId: await resolveMediaId(nextPost.ogImage, "OG image"),
      },
    });

    revalidateCmsState();
    return NextResponse.json({
      success: true,
      item: created,
      items: await prisma.post.findMany({ orderBy: { createdAt: "desc" } }),
      message: "✅ Blog post created",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to create post",
    }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  try {
    const payload = await request.json();
    const nextPost = normalizePost(payload);

    if (!nextPost.id) {
      throw new Error("Post id is required");
    }

    const updated = await prisma.post.update({
      where: { id: nextPost.id },
      data: {
        title: nextPost.title,
        slug: nextPost.slug,
        excerpt: nextPost.excerpt,
        body: nextPost.body,
        imageAlt: nextPost.imageAlt,
        status: nextPost.status,
        featuredImageId: await resolveMediaId(nextPost.featuredImage, "featured image"),
        thumbnailImageId: await resolveMediaId(nextPost.thumbnailImage, "thumbnail image"),
        ogImageId: await resolveMediaId(nextPost.ogImage, "OG image"),
      },
    });

    revalidateCmsState();
    return NextResponse.json({
      success: true,
      item: updated,
      items: await prisma.post.findMany({ orderBy: { createdAt: "desc" } }),
      message: "✅ Blog post updated",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to update post",
    }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  try {
    const payload = await request.json();
    const id = String(payload.id ?? "").trim();

    if (!id) {
      throw new Error("Post id is required");
    }

    await prisma.post.delete({ where: { id } });

    revalidateCmsState();
    return NextResponse.json({
      success: true,
      items: await prisma.post.findMany({ orderBy: { createdAt: "desc" } }),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to delete post",
    }, { status: 400 });
  }
}
