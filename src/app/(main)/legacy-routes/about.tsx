"use client";

import { useState, useEffect, useRef } from "react";
import {
  motion, useScroll, useTransform, useInView,
} from "framer-motion";
import {
  Shield, ShieldCheck, Zap, Globe, Lock, Eye, Cloud, Code2, Users, Award,
  ArrowRight, ChevronDown, Star, Quote, Cpu, Target, HeartHandshake, Lightbulb,
  GitBranch, Rocket, TrendingUp, Building2, Handshake, Fingerprint, Layers,
  Workflow, CheckCircle2, Milestone, Flag,
} from "lucide-react";

import { getBlockProp } from "@/features/cms/page-builder";

/* ══════════════════ ANIMATED BACKGROUNDS ══════════════════ */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,216,201,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,216,201,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[160px] bg-phause-teal/20 -top-40 -left-40"
        animate={{ x: [0, 80, 0], y: [0, 50, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[160px] bg-cyan-500/15 bottom-0 right-0"
        animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function ParticleField() {
  const particles = Array.from({ length: 25 });
  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-phause-cyan"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            opacity: 0.4,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.1, 0.7, 0.1] }}
          transition={{
            duration: 3 + (i % 5),
            repeat: Infinity,
            delay: (i % 7) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════ SECTION HEADING ══════════════════ */
function SectionHeading({
  tag, title, subtitle,
}: { tag: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16">
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-phause-cyan/10 text-phause-cyan border border-phause-cyan/20 mb-4"
      >
        {tag}
      </motion.span>
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-lg"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/* ══════════════════ PAGE HERO ══════════════════ */
function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 100]);

  return (
    <section className="relative min-h-[65vh] flex items-center justify-center overflow-hidden pt-24">
      <GridBackground />
      <ParticleField />
      <motion.div style={{ y }} className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-sm text-phause-cyan mb-8"
        >
          <Milestone className="w-4 h-4" /> {eyebrow}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-black leading-[1.05] mb-6"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto"
        >
          {description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="w-8 h-8 text-phause-cyan/60" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ══════════════════ ABOUT US ══════════════════ */
function AboutUs({
  tag = "About Us",
  title = "About us",
  description = "Building the next chapter of secure digital operations.",
  secondaryDescription = "Our approach keeps security practical, transparent and resilient.",
  items = [
    { icon: Award, label: "Enterprise-grade" },
    { icon: Users, label: "Trusted by teams" },
    { icon: Globe, label: "Globally monitored" },
    { icon: Cpu, label: "Secure by design" },
  ],
}: {
  tag?: string;
  title?: string;
  description?: string;
  secondaryDescription?: string;
  items?: Array<{ icon: React.ElementType; label: string }>;
}) {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-phause-cyan/8 blur-[150px]" />
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-5 gap-16 items-start">
        {/* Text column */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-3"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-phause-cyan/10 text-phause-cyan border border-phause-cyan/20 mb-5">
            {tag}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-8 leading-tight">
            {title}
          </h2>

          <div className="space-y-6 text-slate-400 leading-relaxed text-[1.05rem]">
            <p>{description}</p>
            <p>{secondaryDescription}</p>
          </div>

          <div className="flex flex-wrap gap-4 mt-10">
            {items.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <motion.span
                  key={`${badge.label}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.08, y: -3 }}
                  className="px-4 py-2 rounded-xl glass text-sm font-semibold text-phause-cyan cursor-default"
                >
                  <span className="inline-flex items-center gap-2"><Icon className="w-4 h-4" /> {badge.label}</span>
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════ WHAT WE DO ══════════════════ */
function WhatWeDo({ items = [
  {
    icon: Shield,
    title: "Continuous Threat Detection & Hunting",
    desc: "Our distributed detection mesh monitors packets, processes, APIs, and identities in real time across every environment.",
  },
  {
    icon: Zap,
    title: "Automated Incident Response",
    desc: "When a critical threat is detected, we execute a pre-authorized response playbook in under 50 milliseconds.",
  },
  {
    icon: Cloud,
    title: "Cloud Security Posture Management",
    desc: "We continuously audit AWS, Azure, and GCP environments against CIS and vendor-specific benchmarks.",
  },
  {
    icon: Code2,
    title: "Application & API Security Testing",
    desc: "We embed security into your software development lifecycle using static and dynamic analysis on every commit.",
  },
  {
    icon: Users,
    title: "Responsible Programme Administration",
    desc: "Organise authorised simulations and follow-up learning through a clear, practical programme workflow.",
  },
  {
    icon: Award,
    title: "Compliance & Governance Automation",
    desc: "Our content and programme guidance are designed around responsible phishing-awareness operations; publish certifications only after verification.",
  },
] }: { items?: Array<{ icon: React.ElementType; title: string; desc: string }> }) {

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-phause-cyan/[0.03] to-transparent" />
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          tag="What We Do"
          title={<>Six disciplines. <span className="text-gradient">One platform.</span></>}
          subtitle="Everything below ships as part of a single unified deployment — no bolt-ons, no integration projects, no vendor finger-pointing."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={`${item.title}-${i}`}
              initial={{ opacity: 0, y: 50, rotateX: -12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.15 }}
              whileHover={{ y: -12 }}
              className="group glass rounded-3xl p-8 relative overflow-hidden hover:border-phause-cyan/40 transition-colors"
            >
              <div className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full bg-phause-cyan/10 blur-[60px] group-hover:bg-phause-cyan/25 transition-all duration-500" />
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.7 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-phause-cyan/20 to-phause-teal/20 border border-phause-cyan/30 flex items-center justify-center mb-6"
              >
                <item.icon className="w-7 h-7 text-phause-cyan" />
              </motion.div>
              <h3 className="text-lg font-bold mb-3">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ COUNTERS ══════════════════ */
function StatCounter({
  val, suffix, label, icon: Icon, delay,
}: { val: number; suffix: string; label: string; icon: React.ElementType; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const duration = 2000;
    const step = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      setCount(Math.floor(p * val));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, val]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -8 }}
      className="glass rounded-3xl p-8 text-center relative overflow-hidden group hover:border-phause-cyan/40 transition-colors"
    >
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-phause-cyan/10 blur-[50px] group-hover:bg-phause-cyan/25 transition-all duration-500" />
      <Icon className="w-8 h-8 text-phause-cyan mx-auto mb-4 relative z-10" />
      <div className="text-4xl md:text-5xl font-black text-gradient relative z-10">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm text-slate-400 mt-3 relative z-10">{label}</div>
    </motion.div>
  );
}

function Counters() {
  return (
    <section className="relative py-24">
      <div className="absolute left-1/2 top-0 w-[700px] h-[400px] rounded-full bg-phause-teal/8 blur-[150px] -translate-x-1/2" />
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          tag="By The Numbers"
          title={<>Proof, not <span className="text-gradient">promises</span></>}
          subtitle="Eight years of consistent, measurable delivery across the metrics that matter."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCounter icon={Building2} val={1250} suffix="+" label="Company Projects" delay={0} />
          <StatCounter icon={Handshake} val={500} suffix="+" label="Active Clients" delay={0.12} />
          <StatCounter icon={CheckCircle2} val={1180} suffix="+" label="Projects Delivered On Time" delay={0.24} />
          <StatCounter icon={Users} val={150} suffix="+" label="Security Experts" delay={0.36} />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-500 mt-8"
        >
          Figures verified as of Q3 2026 across all Phause operating regions.
        </motion.p>
      </div>
    </section>
  );
}

/* ══════════════════ WHY CHOOSE US ══════════════════ */
function WhyChooseUs({ reasons = [
    {
      icon: Eye,
      title: "Purposeful Practice",
      desc: "Phishing simulations should support a clear learning objective and appropriate organisational authorisation.",
    },
    {
      icon: Cpu,
      title: "Context for Campaign Activity",
      desc: "Interaction events and campaign metrics should be interpreted carefully rather than treated as a complete measure of employee knowledge.",
    },
    {
      icon: Users,
      title: "Constructive Follow-Through",
      desc: "Campaign findings should guide relevant awareness activity, training and future programme improvements.",
    },
    {
      icon: Lock,
      title: "Responsible Use",
      desc: "Employee-level results should be handled confidentially and used to support improvement, not embarrassment.",
    },
  ] }: { reasons?: Array<{ icon: React.ElementType; title: string; desc: string }> }) {

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute right-0 top-1/4 w-[450px] h-[450px] rounded-full bg-cyan-500/8 blur-[140px]" />
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          tag="Why Choose Us"
          title={<>Six reasons teams <span className="text-gradient">never leave</span></>}
          subtitle="We don't win clients with discounts. We keep them with outcomes."
        />
        <div className="grid md:grid-cols-2 gap-8">
          {reasons.map((r, i) => (
            <motion.div
              key={`${r.title}-${i}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (i % 2) * 0.12 }}
              whileHover={{ scale: 1.02 }}
              className="group flex gap-6 glass rounded-3xl p-8 hover:border-phause-cyan/40 hover:shadow-[0_0_40px_rgba(0,216,201,0.1)] transition-all duration-300"
            >
              <motion.div
                whileHover={{ rotate: 8, scale: 1.08 }}
                className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-phause-cyan to-phause-teal flex items-center justify-center shadow-[0_0_25px_rgba(0,216,201,0.35)]"
              >
                <r.icon className="w-8 h-8 text-phause-dark" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold mb-2.5">{r.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ OUR COMMITMENT ══════════════════ */
function OurCommitment({ commitments = [
    {
      icon: Target,
      title: "To Our Clients",
      desc: "We commit to honest risk assessments, transparent pricing and a contractual SLA we have never breached.",
    },
    {
      icon: Users,
      title: "To Our Team",
      desc: "We commit to sustainable careers, sensible on-call rotations and protected learning time for every engineer.",
    },
    {
      icon: Globe,
      title: "To the Security Community",
      desc: "We commit to making the internet safer, not just for our paying clients, through open research and reusable detection rules.",
    },
    {
      icon: Lightbulb,
      title: "To the Future",
      desc: "We commit to anticipating the next decade of threats, including post-quantum cryptography and AI-driven attack vectors.",
    },
  ] }: { commitments?: Array<{ icon: React.ElementType; title: string; desc: string }> }) {

  return (
    <section className="relative py-28">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeading
          tag="Our Commitment"
          title={<>Promises we put <span className="text-gradient">in writing</span></>}
          subtitle="Values on a slide deck mean nothing. Here's what we're contractually, culturally, and personally committed to."
        />
        <div className="grid md:grid-cols-2 gap-8">
          {commitments.map((c, i) => (
            <motion.div
              key={`${c.title}-${i}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (i % 2) * 0.12 }}
              whileHover={{ y: -8 }}
              className="relative glass rounded-3xl p-9 overflow-hidden hover:border-phause-cyan/40 transition-colors group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-phause-cyan to-phause-teal opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 mb-5">
                <div className="w-13 h-13 p-3.5 rounded-2xl bg-phause-cyan/10 border border-phause-cyan/20 group-hover:bg-phause-cyan/20 transition-colors">
                  <c.icon className="w-7 h-7 text-phause-cyan" />
                </div>
                <h3 className="text-xl font-bold">{c.title}</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ TESTIMONIALS ══════════════════ */
function Testimonials({ testimonials = [] }: { testimonials?: Array<{ name: string; role: string; text: string; stars: number }> }) {
  if (testimonials.length === 0) return null;
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute right-1/4 top-0 w-[400px] h-[400px] rounded-full bg-phause-cyan/8 blur-[130px]" />
      <div className="max-w-7xl mx-auto px-6 mb-14">
        <SectionHeading
          tag="Testimonials"
          title={<>Relationships measured <span className="text-gradient">in years</span></>}
          subtitle="Our average client tenure is 4.2 years. Here's why they stay."
        />
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-phause-dark to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-phause-dark to-transparent z-10 pointer-events-none" />
        <motion.div
          className="flex gap-8 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
        >
          {doubled.map((t, i) => (
            <div
              key={i}
              className="w-[380px] shrink-0 glass rounded-3xl p-8 hover:border-phause-cyan/40 transition-colors"
            >
              <Quote className="w-8 h-8 text-phause-cyan/40 mb-4" />
              <p className="text-slate-300 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 text-phause-cyan" fill="currentColor" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-phause-cyan to-phause-teal flex items-center justify-center font-bold text-phause-dark">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════ JOURNEY TIMELINE ══════════════════ */
function JourneyTimeline({ milestones = [] }: { milestones?: Array<{ year: string; title: string; icon: React.ElementType; desc: string }> }) {
  if (milestones.length === 0) return null;
  const [activeYear, setActiveYear] = useState(0);

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute left-1/2 top-0 w-[600px] h-[500px] rounded-full bg-phause-teal/8 blur-[160px] -translate-x-1/2" />
      <div className="max-w-5xl mx-auto px-6">
        <SectionHeading
          tag="Our Journey So Far"
          title={<>Eight years. <span className="text-gradient">One obsession.</span></>}
          subtitle="From a rented garage to a global defense grid — every chapter written with our clients."
        />

        {/* Year selector pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {milestones.map((m, i) => (
            <motion.button
              key={m.year}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setActiveYear(i)}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeYear === i
                  ? "bg-gradient-to-r from-phause-cyan to-phause-teal text-phause-dark shadow-[0_0_25px_rgba(0,216,201,0.45)]"
                  : "glass text-slate-300 hover:border-phause-cyan/40"
              }`}
            >
              {m.year}
            </motion.button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-[2px] md:-translate-x-1/2 bg-gradient-to-b from-phause-cyan/60 via-phause-cyan/20 to-transparent" />
          <div className="space-y-16">
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className={`relative flex flex-col md:flex-row gap-8 md:gap-0 items-start ${
                  i % 2 === 0 ? "" : "md:flex-row-reverse"
                }`}
              >
                {/* Node */}
                <motion.div
                  whileHover={{ scale: 1.25 }}
                  className="absolute left-6 md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-2xl bg-gradient-to-br from-phause-cyan to-phause-teal flex items-center justify-center shadow-[0_0_30px_rgba(0,216,201,0.45)] z-10 cursor-pointer"
                  onClick={() => setActiveYear(i)}
                >
                  <m.icon className="w-6 h-6 text-phause-dark" />
                </motion.div>

                {/* Card */}
                <div
                  className={`ml-20 md:ml-0 md:w-[calc(50%-3.5rem)] ${
                    i % 2 === 0 ? "md:mr-auto" : "md:ml-auto"
                  }`}
                >
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    onClick={() => setActiveYear(i)}
                    className={`glass rounded-3xl p-8 cursor-pointer transition-all duration-300 ${
                      activeYear === i
                        ? "border-phause-cyan/60 shadow-[0_0_40px_rgba(0,216,201,0.15)]"
                        : "hover:border-phause-cyan/40"
                    }`}
                  >
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-phause-cyan/10 text-phause-cyan border border-phause-cyan/20 mb-3">
                      {m.year}
                    </span>
                    <h3 className="text-xl font-bold mb-3">{m.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{m.desc}</p>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ CTA BANNER ══════════════════ */
function CTABanner() {
  return (
    <section className="relative py-20">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[2.5rem] overflow-hidden p-12 md:p-16 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-phause-cyan/20 via-phause-teal/10 to-transparent" />
          <div className="absolute inset-0 glass" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-5">
              The next chapter could be <span className="text-gradient">yours</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
              Explore how Phause can support a more consistent, responsible phishing-awareness programme.
            </p>
            <motion.a
              href="/#register"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal text-phause-dark font-bold text-lg shadow-[0_0_50px_rgba(0,216,201,0.5)]"
            >
              Create an Account <ArrowRight className="w-5 h-5" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════ PAGE ══════════════════ */
export default function AboutPage() {
  const [page, setPage] = useState<Record<string, unknown> | null>(null);
  const [cmsTestimonials, setCmsTestimonials] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    fetch("/api/cms/pages?slug=about")
      .then((response) => response.json())
      .then((payload) => setPage(payload.page ?? null))
      .catch(() => setPage(null));

    fetch("/api/cms/testimonials")
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload.items)) {
          setCmsTestimonials(payload.items.filter((item: Record<string, unknown>) => String(item.status ?? "DRAFT").toUpperCase() === "PUBLISHED"));
        }
      })
      .catch(() => setCmsTestimonials([]));
  }, []);

  const pageBlocks = Array.isArray(page?.blocks) ? (page.blocks as Array<Record<string, unknown>>) : [];
  const heroBlock = ((pageBlocks.find((block) => String((block.type ?? "")).replace(/[_-]+/g, "").toLowerCase() === "hero") ?? pageBlocks.find((block) => String((block.type ?? "")).replace(/[_-]+/g, "").toLowerCase() === "abouthero"))?.props as Record<string, unknown>) ?? {};
  const capabilityBlock = (pageBlocks.find((block) => String((block.type ?? "")).replace(/[_-]+/g, "").toLowerCase() === "aboutcapabilities")?.props as Record<string, unknown>) ?? {};
  const valuesBlock = (pageBlocks.find((block) => String((block.type ?? "")).replace(/[_-]+/g, "").toLowerCase() === "aboutvalues")?.props as Record<string, unknown>) ?? {};
  const commitmentsBlock = (pageBlocks.find((block) => String((block.type ?? "")).replace(/[_-]+/g, "").toLowerCase() === "aboutcommitments")?.props as Record<string, unknown>) ?? {};
  const timelineBlock = (pageBlocks.find((block) => String((block.type ?? "")).replace(/[_-]+/g, "").toLowerCase() === "abouttimeline")?.props as Record<string, unknown>) ?? {};

  const capabilityItems = Array.isArray(capabilityBlock.items)
    ? capabilityBlock.items.map((item, index: number) => {
        const capability = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
        const iconName = String(capability.icon ?? "shield");
        const iconMap: Record<string, React.ElementType> = { shield: Shield, zap: Zap, cloud: Cloud, code: Code2, users: Users, award: Award };
        return {
          icon: iconMap[iconName.toLowerCase()] ?? [Shield, Zap, Cloud, Code2, Users, Award][index % 6] ?? Shield,
          title: typeof capability.title === "string" ? capability.title : `Capability ${index + 1}`,
          desc: typeof capability.description === "string" ? capability.description : typeof capability.desc === "string" ? capability.desc : "",
        };
      })
    : undefined;

  const valuesItems = Array.isArray(valuesBlock.items)
    ? valuesBlock.items.map((item, index: number) => {
        const value = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
        const iconName = String(value.icon ?? "zap");
        const iconMap: Record<string, React.ElementType> = { zap: Zap, cpu: Cpu, eye: Eye, lock: Lock, handshake: HeartHandshake, trending: TrendingUp };
        return {
          icon: iconMap[iconName.toLowerCase()] ?? [Zap, Cpu, Eye, Lock, HeartHandshake, TrendingUp][index % 6] ?? Zap,
          title: typeof value.title === "string" ? value.title : `Value ${index + 1}`,
          desc: typeof value.description === "string" ? value.description : typeof value.desc === "string" ? value.desc : "",
        };
      })
    : undefined;

  const commitmentsItems = Array.isArray(commitmentsBlock.items)
    ? commitmentsBlock.items.map((item, index: number) => {
        const commitment = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
        const iconName = String(commitment.icon ?? "target");
        const iconMap: Record<string, React.ElementType> = { target: Target, users: Users, globe: Globe, lightbulb: Lightbulb };
        return {
          icon: iconMap[iconName.toLowerCase()] ?? [Target, Users, Globe, Lightbulb][index % 4] ?? Target,
          title: typeof commitment.title === "string" ? commitment.title : `Commitment ${index + 1}`,
          desc: typeof commitment.description === "string" ? commitment.description : typeof commitment.desc === "string" ? commitment.desc : "",
        };
      })
    : undefined;

  const timelineItems = Array.isArray(timelineBlock.items)
    ? timelineBlock.items.map((item, index: number) => {
        const milestone = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
        const iconName = String(milestone.icon ?? "flag");
        const iconMap: Record<string, React.ElementType> = { flag: Flag, rocket: Rocket, shield: Shield, cpu: Cpu, award: Award, layers: Layers, eye: Eye, workflow: Workflow, globe: Globe };
        return {
          year: typeof milestone.year === "string" || typeof milestone.year === "number" ? String(milestone.year) : `20${index + 18}`,
          title: typeof milestone.title === "string" ? milestone.title : `Milestone ${index + 1}`,
          icon: iconMap[iconName.toLowerCase()] ?? [Flag, Rocket, Shield, Cpu, Award, Layers, Eye, Workflow, Globe][index % 9] ?? Flag,
          desc: typeof milestone.description === "string" ? milestone.description : typeof milestone.desc === "string" ? milestone.desc : "",
        };
      })
    : undefined;

  const testimonialsBlock = (pageBlocks.find((block) => String((block.type ?? "")).replace(/[_-]+/g, "").toLowerCase() === "testimonial")?.props as Record<string, unknown>) ?? {};
  const testimonialsItems = cmsTestimonials.length > 0
    ? cmsTestimonials.map((item) => ({
        name: String(item.author ?? "Client"),
        role: String(item.role ?? "Customer"),
        text: String(item.quote ?? ""),
        stars: 5,
      }))
    : Array.isArray(testimonialsBlock.items) && (testimonialsBlock.items as Array<Record<string, unknown>>).length > 0
      ? testimonialsBlock.items.map((item) => {
          const testimonial = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
          return {
            name: typeof testimonial.name === "string" ? testimonial.name : "Client",
            role: typeof testimonial.role === "string" ? testimonial.role : "Customer",
            text: typeof testimonial.text === "string" ? testimonial.text : typeof testimonial.quote === "string" ? testimonial.quote : "",
            stars: Number(testimonial.stars ?? 5),
          };
        })
      : undefined;

  const aboutSectionTitle = getBlockProp(heroBlock, "aboutTitle", "A practical workspace for security awareness.");

  return (
    <>
      <PageHero
        eyebrow={getBlockProp(heroBlock, "eyebrow", "Who We Are")}
        title={getBlockProp(heroBlock, "title", "The Team Behind the Shield")}
        description={getBlockProp(heroBlock, "description", "From a two-person research lab to a global cybersecurity force — this is the story, the mission, and the machine behind Phause.")}
      />
      <AboutUs
        tag={getBlockProp(heroBlock, "eyebrow", "About Us")}
        title={aboutSectionTitle}
        description={getBlockProp(heroBlock, "description", "Phause was founded in 2018 by two security researchers who kept seeing the same pattern repeat itself: companies were spending millions on cybersecurity tools and still getting breached.")}
        secondaryDescription={getBlockProp(heroBlock, "subtitle", "The answer became the three pillars that still define everything we build at Phause — Strengthen, Aware, Defend.")}
        items={capabilityItems?.slice(0, 4).map((item) => ({
          icon: item.icon,
          label: item.title,
        }))}
      />
      <WhatWeDo items={capabilityItems} />
      <WhyChooseUs reasons={valuesItems} />
      <OurCommitment commitments={commitmentsItems} />
      <Testimonials testimonials={testimonialsItems} />
      <JourneyTimeline milestones={timelineItems} />
      <CTABanner />
    </>
  );
}
