"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  House,
  Link2,
  Mail,
  RouteOff,
  Search,
  ShieldAlert,
} from "lucide-react";

const popularDestinations = [
  { label: "Dashboard", href: "/studio" },
  { label: "Services", href: "/services" },
  { label: "Blog", href: "/blog" },
  { label: "Documentation", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

export function BrandNotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-16 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,0.15),transparent_35%)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl"
      >
        <div className="overflow-hidden rounded-[32px] border border-slate-800/80 bg-[#0f172a]/90 shadow-[0_30px_120px_rgba(2,8,23,0.8)] backdrop-blur-sm">
          <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
            <div className="flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
                className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Error 404
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
                className="text-5xl font-black tracking-[-0.08em] text-white md:text-7xl"
              >
                404
              </motion.h1>

              <motion.h2
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
                className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100 md:text-4xl"
              >
                Page Not Found
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
                className="mt-5 max-w-xl text-base leading-7 text-slate-300 md:text-lg"
              >
                The page you are looking for does not exist,
                may have been moved,
                or the URL is incorrect.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-100"
              >
                This content is currently unavailable.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.36, ease: "easeOut" }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(6,182,212,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(6,182,212,0.5)]"
                >
                  <House className="h-4 w-4" />
                  Return Home
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  <Mail className="h-4 w-4" />
                  Contact Support
                </Link>

                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/40 hover:text-cyan-200"
                >
                  <BookOpen className="h-4 w-4" />
                  Open Documentation
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.42, ease: "easeOut" }}
                className="mt-8"
              >
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                  Popular destinations
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularDestinations.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.16, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              <div className="relative w-full max-w-md">
                <motion.div
                  animate={{ scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 4.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="absolute inset-8 rounded-full bg-cyan-500/10 blur-3xl"
                />

                <div className="relative rounded-[30px] border border-slate-800 bg-gradient-to-br from-slate-950 via-[#0f172a] to-[#020617] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs uppercase tracking-[0.22em] text-slate-400">
                    <span>Signal Lost</span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-300">offline</span>
                  </div>

                  <div className="mt-6 flex items-center justify-center">
                    <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/5 shadow-[0_0_50px_rgba(6,182,212,0.18)]">
                      <ShieldAlert className="h-20 w-20 text-cyan-300" />
                      <div className="absolute -right-2 top-8 rounded-full border border-slate-700 bg-slate-950 p-3 text-cyan-300 shadow-lg shadow-cyan-500/10">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="absolute -bottom-1 left-10 rounded-full border border-slate-700 bg-slate-950 p-3 text-slate-200 shadow-lg shadow-slate-900/50">
                        <RouteOff className="h-5 w-5" />
                      </div>
                      <div className="absolute right-10 -bottom-3 rounded-full border border-slate-700 bg-slate-950 p-3 text-slate-200 shadow-lg shadow-slate-900/50">
                        <Link2 className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                    <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                      Search website
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-400">
                      <Search className="h-4 w-4 text-cyan-300" />
                      <input
                        type="text"
                        value=""
                        readOnly
                        placeholder="Search website..."
                        className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
                        aria-label="Search website"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
