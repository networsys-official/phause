import { prisma } from "@/infrastructure/database/prisma";
import { FormsEditor } from "@/components/cms/content-editors";
import { ensureDefaultCmsContent } from "@/features/cms/content-service";
import { CmsShell } from "@/components/cms/admin-shell";

export default async function CmsFormsPage() {
  await ensureDefaultCmsContent();

  const forms = await prisma.form.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CmsShell title="Forms" description="Create, edit, and manage site forms from the database.">
      <FormsEditor forms={forms.map((form) => ({
        id: form.id,
        name: form.name,
        slug: form.slug,
        status: form.status,
        fields: Array.isArray(form.fields) ? form.fields : [],
      }))} />
    </CmsShell>
  );
}
