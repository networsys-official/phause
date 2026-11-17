"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    setEmail("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-900/80 p-8">
        <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">Reset access</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Forgot your password?</h1>
        <p className="mt-2 text-sm text-slate-400">Enter your email and we’ll send a secure reset link.</p>

        {sent ? (
          <div className="mt-5 rounded-xl border border-emerald-700 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-200">Password reset instructions sent.</div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@phause.com" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500" required />
          </label>
          <button type="submit" className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">Send reset link</button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-400">
          Remembered it? <Link href="/auth/login" className="text-cyan-300">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
