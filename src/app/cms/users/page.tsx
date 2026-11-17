"use client";

import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";

type WorkspaceUser = {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  status: string;
};

export default function CmsUsersPage() {
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" });

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    const response = await fetch("/api/cms/users");
    if (response.ok) {
      const payload = await response.json();
      setUsers(payload);
    }
    setLoading(false);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/cms/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      setForm({ name: "", email: "", password: "", role: "VIEWER" });
      await loadUsers();
    }

    setSaving(false);
  }

  return (
    <CmsShell title="Users" description="Manage workspace access and roles for your content team.">
      <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
        <form onSubmit={handleCreate} className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Create user</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Name</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" required />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Password</span>
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" required />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Role</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500">
                <option value="VIEWER">Viewer</option>
                <option value="AUTHOR">Author</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </label>
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
              {saving ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Workspace access</h2>
            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">{users.length} users</span>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading users...</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div>
                    <div className="font-medium text-white">{user.name || user.email}</div>
                    <div className="text-sm text-slate-400">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">{user.role}</span>
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300">{user.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CmsShell>
  );
}
