"use client";

import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";

type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor?: string | null;
  createdAt: string | Date;
};

export default function CmsAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const response = await fetch("/api/cms/audit");
      if (response.ok) {
        const payload = await response.json();
        setLogs(payload);
      }
      setLoading(false);
    }

    void loadLogs();
  }, []);

  return (
    <CmsShell title="Audit Logs" description="Track important account actions and security-sensitive changes across the workspace.">
      <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
        {loading ? (
          <p className="text-slate-400">Loading audit trail...</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <div className="text-sm font-medium text-white">{log.action}</div>
                  <div className="text-xs text-slate-400">{log.entityType} / {log.entityId}</div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <div>{log.actor || "System"}</div>
                  <div>{new Date(log.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CmsShell>
  );
}
