import { prisma } from "@/infrastructure/database/prisma";

export const dynamic = "force-dynamic";

export default async function CmsLeadsPage() {
  const leads = await prisma.lead.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">Leads</h1>
        <p className="mt-2 text-sm text-slate-400">
          Organisation enquiries and form submissions.
        </p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Company</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t border-slate-800"
                >
                  <td className="p-4">{lead.name ?? "—"}</td>
                  <td className="p-4">{lead.email ?? "—"}</td>
                  <td className="p-4">{lead.company ?? "—"}</td>
                  <td className="p-4">{lead.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
