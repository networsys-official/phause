import { prisma } from "@/infrastructure/database/prisma";
import { LeadsEditor } from "@/components/cms/content-editors";
import { ensureDefaultCmsContent } from "@/features/cms/content-service";
import { CmsShell } from "@/components/cms/admin-shell";

export default async function CmsLeadsPage() {
  await ensureDefaultCmsContent();

  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <CmsShell title="Leads" description="Review captured leads and update status and qualification.">
      <LeadsEditor leads={leads.map((lead) => ({
        id: lead.id,
        name: lead.name ?? "Unknown lead",
        email: lead.email ?? "",
        company: lead.company ?? "",
        message: lead.message ?? "",
        source: lead.source ?? "Website",
        status: lead.status,
      }))} />
    </CmsShell>
  );
}
