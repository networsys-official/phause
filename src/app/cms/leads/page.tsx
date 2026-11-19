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

  console.info("LEADS_FETCH_COUNT", { count: leads.length, source: "cms-leads-page" });

  return (
    <CmsShell title="Leads" description="Manage enquiries through qualification and closure.">
      <LeadsEditor leads={leads.map((lead) => ({
        id: lead.id,
        name: lead.name ?? "Unknown lead",
        email: lead.email ?? "",
        phone: lead.phone ?? "",
        company: lead.company ?? "",
        category: lead.category,
        message: lead.message ?? "",
        source: lead.source ?? "Website",
        assignedTo: lead.assignedTo ?? "",
        createdAt: lead.createdAt.toISOString(),
        status: lead.status,
      }))} />
    </CmsShell>
  );
}
