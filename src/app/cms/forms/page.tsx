import { prisma } from "@/infrastructure/database/prisma";
import { FormsEditor } from "@/components/cms/content-editors";
import { CmsShell } from "@/components/cms/admin-shell";
import { Suspense } from "react";

export default async function CmsFormsPage() {
  const forms = await prisma.form.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const pages = await prisma.page.findMany({
    where: { deletedAt: null },
    include: { blocks: { where: { deletedAt: null } } },
  });

  return (
    <CmsShell title="Forms" description="Create, edit, and manage site forms from the database.">
      <Suspense fallback={<div>Loading...</div>}>
        <FormsEditor forms={forms.map((form) => ({
          id: form.id,
          name: form.name,
          slug: form.slug,
          status: form.status,
          fields: Array.isArray(form.fields) ? form.fields : [],
          usedOn: pages.filter((page) => page.blocks.some((block) => {
            const props = block.props as Record<string, unknown>;
            return block.type.toLowerCase() === "form" && props.formSlug === form.slug;
          })).map((page) => `/${page.slug}`),
        }))} />
      </Suspense>
    </CmsShell>
  );
}
