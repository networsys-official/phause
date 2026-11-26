import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma";
import { hasCmsRequestAccess } from "@/lib/cms-access";
import { logger } from "@/shared/lib/logger";
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { isSystemPageSlug } from "@/features/cms/page-menu-service";
import { cmsFormCreateSchema } from "@/features/cms/form-schema";

function canAccess(request: NextRequest) {
  return hasCmsRequestAccess(request.headers);
}

export async function GET(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "global";
  const rateLimit = checkRateLimit(`cms-forms:${key}`, 120, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ success: false, message: "Rate limit exceeded." }, { status: 429 });
  }

  const forms = await prisma.form.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, forms });
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const parsed = cmsFormCreateSchema.parse(await request.json());

    const duplicate = await prisma.form.findUnique({ where: { slug: parsed.slug } });
    if (duplicate) {
      return NextResponse.json({ success: false, message: `A form with slug "${parsed.slug}" already exists.` }, { status: 409 });
    }

    const fields = parsed.fields.map((field) => ({
      key: field.key,
      label: field.label,
      type: field.type === "phone" ? "tel" : field.type,
      placeholder: field.placeholder,
      ...(field.required ? { required: true } : {}),
      ...((field.type === "select" || field.type === "radio") ? { options: field.options } : {}),
    }));

    const form = await prisma.$transaction(async (tx) => {
      const created = await tx.form.create({
        data: {
          slug: parsed.slug,
          name: parsed.name,
          fields: fields as Prisma.InputJsonValue,
          status: parsed.status,
          publishedAt: parsed.status === "PUBLISHED" ? new Date() : null,
          version: 1,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "Form",
          entityId: created.id,
          action: parsed.status === "PUBLISHED" ? "PUBLISH" : "CREATE",
          metadata: { slug: created.slug, status: created.status, fieldCount: fields.length },
          formId: created.id,
        },
      });

      if (parsed.status === "PUBLISHED" && parsed.placement) {
        const placement = parsed.placement;
        if (isSystemPageSlug(placement.pageSlug)) {
          const protectedError = new Error("System pages are protected from form block placement.");
          Object.assign(protectedError, { status: 400, code: "PROTECTED_PAGE" });
          throw protectedError;
        }

        const page = await tx.page.findFirst({
          where: { slug: placement.pageSlug, deletedAt: null },
          include: { blocks: { where: { deletedAt: null }, orderBy: { order: "asc" } } },
        });
        if (!page) {
          const missingError = new Error("The selected page could not be found.");
          Object.assign(missingError, { status: 404, code: "PAGE_NOT_FOUND" });
          throw missingError;
        }
        if (page.version !== placement.pageVersion) {
          const conflict = new Error("This page changed in another tab. Refresh and try again.");
          Object.assign(conflict, { status: 409, code: "VERSION_CONFLICT", currentVersion: page.version });
          throw conflict;
        }

        let insertIndex: number;
        try {
          insertIndex = getFormPlacementIndex(page.blocks, placement.position, placement.afterBlockId);
        } catch (error) {
          const blockError = new Error(error instanceof Error ? error.message : "The selected page block could not be found.");
          Object.assign(blockError, { status: 409, code: "BLOCK_NOT_FOUND" });
          throw blockError;
        }

        for (const [index, block] of page.blocks.entries()) {
          const adjustedIndex = index >= insertIndex ? index + 1 : index;
          await tx.pageBlock.update({ where: { id: block.id }, data: { order: adjustedIndex } });
        }

        await tx.pageBlock.create({
          data: {
            pageId: page.id,
            type: "FORM",
            order: insertIndex,
            props: { formSlug: created.slug } as Prisma.InputJsonValue,
            version: 1,
          },
        });

        await tx.page.update({
          where: { id: page.id },
          data: { version: { increment: 1 } },
        });

        await tx.auditLog.create({
          data: {
            entityType: "Page",
            entityId: page.id,
            action: "UPDATE",
            metadata: { slug: page.slug, formSlug: created.slug, placement: placement.position },
            pageId: page.id,
          },
        });
      }

      return created;
    });

    if (form.status === "PUBLISHED") {
      revalidateCmsState(form.slug);
      if (parsed.placement) revalidateCmsState(parsed.placement.pageSlug);
    }
    return NextResponse.json({ success: true, form }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message ?? "Invalid form data.", issues: error.issues }, { status: 400 });
    }
    if (error && typeof error === "object" && "status" in error) {
      const status = Number((error as { status?: number }).status);
      const code = "code" in error ? String((error as { code?: string }).code) : undefined;
      return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Form placement failed.", code }, { status: status >= 400 ? status : 400 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ success: false, message: "A form with that slug already exists." }, { status: 409 });
    }
    logger.error("Form creation failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Form creation failed." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const id = String((body as { id?: string }).id ?? "");
    const slug = String((body as { slug?: string }).slug ?? "");

    const payload = body as { id?: string; slug?: string; name?: string; fields?: unknown[]; status?: string };
    const status = typeof payload.status === "string" ? (payload.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED") : "PUBLISHED";
    const form = await prisma.form.upsert({
      where: { slug: slug || id || "untitled-form" },
      update: {
        name: String(payload.name ?? "Untitled form"),
        fields: Array.isArray(payload.fields) ? (payload.fields as Prisma.InputJsonValue) : [],
        status,
        version: { increment: 1 },
      },
      create: {
        slug: slug || String(payload.name ?? "untitled-form"),
        name: String(payload.name ?? "Untitled form"),
        fields: Array.isArray(payload.fields) ? (payload.fields as Prisma.InputJsonValue) : [],
        status,
        version: 1,
      },
    });

    revalidateCmsState();
    return NextResponse.json({ success: true, form });
  } catch (error) {
    logger.error("Form update failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Form update failed." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;

  if (!canAccess(request)) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = String((body as { id?: string }).id ?? "");
    const slug = String((body as { slug?: string }).slug ?? "");

    if (!id && !slug) {
      return NextResponse.json({ success: false, message: "Form id or slug is required." }, { status: 400 });
    }

    const form = await prisma.form.update({
      where: id ? { id } : { slug },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });

    revalidateCmsState();
    return NextResponse.json({ success: true, form });
  } catch (error) {
    logger.error("Form delete failed", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ success: false, message: "Form delete failed." }, { status: 500 });
  }
}

export function getFormPlacementIndex(blocks: Array<{ id: string }>, position: "top" | "bottom" | "after", afterBlockId?: string) {
  if (position === "top") return 0;
  if (position === "after") {
    const targetIndex = blocks.findIndex((block) => block.id === afterBlockId);
    if (targetIndex < 0) throw new Error("The selected page block could not be found.");
    return targetIndex + 1;
  }
  return blocks.length;
}
