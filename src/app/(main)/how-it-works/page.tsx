"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Mail,
  MousePointerClick,
  BarChart3,
  GraduationCap,
  Users,
  ShieldCheck,
  Target,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Prepare your people",
    description:
      "Create your organisation, add employee records, organise people by department and confirm which employees are eligible for simulations.",
    detail: "You control the audience. Only employees marked as consented are eligible to receive simulation emails.",
  },
  {
    number: "02",
    icon: Mail,
    title: "Choose a simulation",
    description:
      "Select an available phishing email template or create a custom template with a subject, HTML content and plain-text alternative.",
    detail: "Preview the message before using it in a campaign.",
  },
  {
    number: "03",
    icon: Target,
    title: "Plan and launch a campaign",
    description:
      "Name the campaign, choose all eligible employees, a department segment or a sample percentage, then send immediately or schedule it.",
    detail: "Review the selected audience and delivery settings before dispatching.",
  },
  {
    number: "04",
    icon: MousePointerClick,
    title: "Understand engagement",
    description:
      "Review recorded events such as email opens, link clicks, landing-page views, submitted-form events and user-reported messages.",
    detail: "Tracking signals are indicators of interaction, not a complete measure of an individual's security knowledge.",
  },
  {
    number: "05",
    icon: BarChart3,
    title: "Report, coach and improve",
    description:
      "Generate campaign reports, inspect employee and department risk indicators, export results and follow up with awareness training.",
    detail: "Use the findings to plan the next learning activity and compare progress over time.",
  },
];

const capabilities = [
  {
    icon: ClipboardList,
    title: "Campaign control",
    description: "Manage templates, targeting, scheduling and campaign status in one workflow.",
  },
  {
    icon: BarChart3,
    title: "Actionable reporting",
    description: "Review engagement metrics, campaign reports, risk trends and department-level insights.",
  },
  {
    icon: GraduationCap,
    title: "Training follow-through",
    description: "Create learning modules, review enrolments and record completion history.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#081522] text-white">
      <section className="relative border-b border-white/10 px-6 pb-20 pt-36 md:pb-28 md:pt-44">
        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            How Phause works
          </span>
          <h1 className="mt-7 text-4xl font-extrabold leading-tight md:text-6xl">
            From a planned simulation to a{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
              stronger awareness programme.
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-slate-400 md:text-lg">
            Phause brings together employee eligibility, phishing email templates, controlled campaigns,
            engagement tracking, reporting and security-awareness training.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/registration"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-teal-300 px-7 py-4 font-bold text-slate-950 transition hover:-translate-y-0.5"
            >
              Create your account <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-4 font-semibold text-white transition hover:border-cyan-300/40"
            >
              Explore platform features
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">The workflow</p>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">Five steps. One connected programme.</h2>
            <p className="mt-5 leading-8 text-slate-400">
              Start with an authorised audience, run a controlled simulation and use the results to guide
              practical follow-up.
            </p>
          </div>
          <div className="space-y-5">
            {steps.map((step, index) => (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="grid gap-5 rounded-3xl border border-white/10 bg-[#101f2e] p-6 md:grid-cols-[90px_1fr] md:p-8"
              >
                <div className="flex items-start gap-4 md:block">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                    <step.icon className="h-7 w-7 text-cyan-300" />
                  </div>
                  <span className="pt-3 text-xs font-bold tracking-[0.2em] text-cyan-300 md:block">{step.number}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{step.description}</p>
                  <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-slate-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                    {step.detail}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0b1927] px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Inside the platform</p>
            <h2 className="mt-4 text-3xl font-extrabold md:text-4xl">The tools your programme uses every day.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {capabilities.map((item) => (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-[#101f2e] p-7">
                <item.icon className="h-8 w-8 text-cyan-300" />
                <h3 className="mt-6 text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 to-teal-300/5 p-8 text-center md:p-14">
          <ShieldCheck className="mx-auto h-10 w-10 text-cyan-300" />
          <h2 className="mt-6 text-3xl font-extrabold md:text-4xl">Run simulations responsibly.</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-300">
            Use Phause only for simulations that your organisation has authorised. Confirm the scope,
            audience and internal approvals before a campaign is dispatched.
          </p>
          <Link
            href="/docs"
            className="mt-8 inline-flex items-center gap-2 font-bold text-cyan-300 transition hover:gap-3"
          >
            Read the customer guide <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
