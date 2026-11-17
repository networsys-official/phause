"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { passwordStrength } from "@/lib/security";

export default function AuthResetPasswordPage() {
  const [password, setPassword] = useState("");
  const strength = useMemo(() => passwordStrength(password), [password]);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-900/80 p-8">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">Security</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Reset password</h1>

        {saved ? <div className="mt-5 rounded-xl border border-emerald-700 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200">Password updated successfully.</div> : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm text-slate-300">
            <span>New password</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="••••••••••••" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" required />
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Password strength</span>
              <span className="font-medium text-white">{strength.label}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div className={`h-2 rounded-full ${strength.color}`} style={{ width: `${(password.length / 18) * 100}%` }} />
            </div>
          </div>

          <button type="submit" className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">Update password</button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-400">
          <Link href="/auth/login" className="text-cyan-300">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
