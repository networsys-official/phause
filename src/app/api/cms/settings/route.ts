import { NextRequest, NextResponse } from "next/server";
import { requireCmsWriteAccess } from "@/features/cms/cms-write-access";
import { revalidateCmsState } from "@/features/cms/cms-revalidation";
import { settingUpdateSchema, validateSettingValue } from "@/features/cms/settings-schema";
import { auth } from "@/auth";
import { z } from "zod";

import { prisma } from "@/infrastructure/database/prisma";

export async function GET() {
  const settings = await prisma.setting.findMany({
    where: { deletedAt: null },
    orderBy: { key: "asc" },
  });

    return NextResponse.json({ success: true, settings });
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, message: "Only a super administrator can change settings." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const entries = Array.isArray(body.settings) ? body.settings : [body];

    const saved = await Promise.all(entries.map(async (entry: Record<string, unknown>) => {
      const key = String(entry.key ?? entry.slug ?? "").trim();
      const value = typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value ?? "");
      const status = entry.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
      const submittedVersion = typeof entry.version === "number" ? entry.version : undefined;

      if (!key) throw new Error("Setting key is required.");
      const parsed = settingUpdateSchema.parse({
        id: typeof entry.id === "string" ? entry.id : undefined,
        key,
        slug: typeof entry.slug === "string" ? entry.slug : key,
        value,
        status,
        version: submittedVersion ?? 0,
      });
      const validationMessage = validateSettingValue(parsed.key, parsed.value);
      if (validationMessage) throw new z.ZodError([{ code: "custom", path: ["value"], message: validationMessage }]);

      return prisma.$transaction(async (tx) => {
        const existing = await tx.setting.findFirst({ where: key ? { key, deletedAt: null } : undefined });
        if (!existing) throw new Error("Setting not found.");
        if (submittedVersion !== undefined && submittedVersion !== existing.version) {
          const conflict = new Error("This setting changed in another tab. Refresh and try again.");
          Object.assign(conflict, { code: "VERSION_CONFLICT", status: 409, currentVersion: existing.version });
          throw conflict;
        }

        const updated = await tx.setting.update({
          where: { id: existing.id },
          data: {
            slug: existing.slug,
            key,
            value,
            status,
            publishedAt: status === "PUBLISHED" ? new Date() : existing.publishedAt,
            version: { increment: 1 },
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: "Setting",
            entityId: existing.id,
            action: status === "PUBLISHED" ? "PUBLISH" : "UPDATE",
            metadata: { key, oldValue: existing.value, newValue: value, status },
            settingId: existing.id,
          },
        });

        return updated;
      });
    }));

    revalidateCmsState();
    return NextResponse.json({ success: true, settings: saved });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0]?.message ?? "Invalid setting value.", issues: error.issues }, { status: 400 });
    }
    const status = error && typeof error === "object" && "status" in error ? Number(error.status) : 500;
    const message = error instanceof Error ? error.message : "Setting update failed.";
    return NextResponse.json({ success: false, message, code: status === 409 ? "VERSION_CONFLICT" : undefined }, { status: status === 409 ? 409 : status });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  const accessError = await requireCmsWriteAccess(request);
  if (accessError) return accessError;
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, message: "Only a super administrator can delete settings." }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? "");
    const key = String(body.key ?? "").trim();
    const systemKeys = new Set(["siteName", "timezone", "publishingMode", "cmsApiEnabled", "mediaPipelineEnabled", "seoSyncEnabled", "supportEmail", "supportPhone", "logoUrl"]);
    if (key && systemKeys.has(key)) return NextResponse.json({ success: false, message: "System settings cannot be deleted." }, { status: 400 });

    const existing = await prisma.setting.findFirst({ where: id ? { id, deletedAt: null } : key ? { key, deletedAt: null } : { id: "__never__" } });
    if (!existing) return NextResponse.json({ success: false, message: "Setting not found." }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.setting.update({ where: { id: existing.id }, data: { deletedAt: new Date(), status: "ARCHIVED" } });
      await tx.auditLog.create({
        data: {
          entityType: "Setting",
          entityId: existing.id,
          action: "DELETE",
          metadata: { key: existing.key, oldValue: existing.value },
          settingId: existing.id,
        },
      });
    });

    revalidateCmsState();
    return NextResponse.json({ success: true, setting: { id: existing.id, key: existing.key } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "Setting delete failed." }, { status: 500 });
  }
}
