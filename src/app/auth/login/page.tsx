"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Suspense, useState } from "react";

import { mapAuthError, normalizeAuthErrorKey } from "@/lib/auth-errors";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reason = searchParams.get("reason");
  const urlError = searchParams.get("error");
  const bannerError = reason === "session_required" ? mapAuthError("SessionRequired") : urlError ? mapAuthError(urlError) : null;
  const bannerErrorKey = reason === "session_required" ? "session_required" : urlError ? normalizeAuthErrorKey(urlError) : null;
  const visibleError = error ?? bannerError;
  const activeErrorKey = errorKey ?? bannerErrorKey;
  const isContextualAlert = ["invalid_credentials", "account_locked", "account_disabled"].includes(activeErrorKey ?? "");

  console.log("FINAL_RENDER", {
    error,
    errorKey,
    visibleError,
  });

  console.log("LOGIN_PAGE_SEARCH_PARAMS", {
    params: Object.fromEntries(searchParams.entries()),
    reason,
    error: urlError,
    mappedBanner: bannerError,
    visibleError,
    activeErrorKey,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setErrorKey(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    console.log("LOGIN_RESULT", {
      error: result?.error,
      ok: result?.ok,
      status: result?.status,
      url: result?.url,
    });

    if (result?.error) {
      const rawError = result.error;
      const normalizedError = String(rawError).trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
      const nextErrorKey = normalizeAuthErrorKey(rawError);
      const mappedError = mapAuthError(rawError);

      console.log("LOGIN_PAGE_RAW_ERROR", {
        rawError,
        normalizedError,
        finalMappedError: nextErrorKey,
        displayedMessage: mappedError,
      });

      console.log("BEFORE_SET_ERROR", {
        rawError,
        mappedError,
        currentErrorState: error,
      });

      setErrorKey(nextErrorKey);
      setError(mappedError);

      console.log("AFTER_SET_ERROR", {
        rawError,
        mappedError,
        currentErrorState: error,
      });

      setSubmitting(false);
      return;
    }

    router.replace("/studio");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-300 text-xl font-black text-slate-950">P</div>
          <p className="text-xs font-medium uppercase tracking-[0.32em] text-cyan-300">Phause Studio</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to manage your content securely.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {visibleError ? (
            <>
              {console.log("RENDERING_BANNER", {
                visibleError,
                error,
                errorKey,
              })}
              <div className={isContextualAlert ? "rounded-xl border border-amber-700 bg-amber-950/40 px-3 py-3 text-sm text-amber-100" : "rounded-xl border border-red-700 bg-red-950/50 px-3 py-3 text-sm text-red-200"}>
                {visibleError.split("\n").map((line, index) => (
                  <div key={`${line}-${index}`}>{line}</div>
                ))}
              </div>
            </>
          ) : null}
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-cyan-500"
              placeholder="you@phause.com"
              required
            />
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-cyan-500"
              placeholder="••••••••••••"
              required
            />
          </label>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <Link href="/auth/reset-password" className="transition hover:text-cyan-300">Forgot password?</Link>
            <Link href="/auth/register" className="transition hover:text-cyan-300">Create account</Link>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AuthLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
