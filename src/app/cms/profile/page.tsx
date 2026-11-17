"use client";

import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";

type ProfilePayload = {
  email?: string | null;
  role?: string | null;
  name?: string | null;
  lastLoginAt?: string | Date | null;
};

export default function CmsProfilePage() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", password: "" });

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/cms/profile");
      if (!response.ok) return;
      const payload = await response.json();
      setProfile(payload);
      setForm((current) => ({ ...current, name: payload?.name ?? "" }));
    }

    void loadProfile();
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/cms/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Unable to update profile");
      return;
    }

    setSuccess("Profile updated successfully.");
    setForm((current) => ({ ...current, password: "" }));
  }

  return (
    <CmsShell title="Profile" description="Update your workspace profile and account security.">
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <form onSubmit={handleSave} className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Account details</h2>
          {error ? <div className="mt-4 rounded-xl border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</div> : null}
          {success ? <div className="mt-4 rounded-xl border border-emerald-700 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200">{success}</div> : null}

          <div className="mt-5 space-y-4">
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">Display name</span>
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="mb-2 block">New password</span>
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" placeholder="Minimum 12 characters" />
            </label>
            <button type="submit" className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">Save profile</button>
          </div>
        </form>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">Session overview</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-slate-400">Email</div>
              <div className="mt-1 font-medium text-white">{profile?.email ?? "Unavailable"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-slate-400">Role</div>
              <div className="mt-1 font-medium text-white">{profile?.role ?? "VIEWER"}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="text-slate-400">Last login</div>
              <div className="mt-1 font-medium text-white">{profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "Not recorded"}</div>
            </div>
          </div>
        </div>
      </div>
    </CmsShell>
  );
}
