"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { passwordStrength } from "@/lib/security";

export default function AuthRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to create account");
      }

      setSuccess("Account created. Redirecting to login...");
      setTimeout(() => router.push("/auth/login"), 800);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-300 text-xl font-black text-slate-950">P</div>
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">Create account</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Set up your workspace</h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? <div className="rounded-xl border border-red-700 bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</div> : null}
          {success ? <div className="rounded-xl border border-emerald-700 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200">{success}</div> : null}

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Full name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" placeholder="Kamal Joshi" required />
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" placeholder="you@phause.com" required />
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" placeholder="At least 12 characters" required />
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

          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60">
            {submitting ? "Creating account..." : "Create account"}
          </button>

          <div className="text-center text-sm text-slate-400">
            Already have an account? <Link href="/auth/login" className="font-medium text-cyan-300">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
