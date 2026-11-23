"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Crown,
  Landmark,
  Rocket,
  Shield,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import {
  BILLING_CYCLE_STORAGE_KEY,
  formatPrice,
  type Plan,
} from "@/app/(main)/subscription/plans";
import { ROUTES } from "@/lib/routes";

const accentStyles: Record<
  string,
  { ring: string; glow: string; badge: string }
> = {
  cyan: {
    ring: "hover:border-phause-cyan/60",
    glow: "group-hover:bg-phause-cyan/25",
    badge: "from-phause-cyan to-phause-teal",
  },
  teal: {
    ring: "hover:border-teal-400/60",
    glow: "group-hover:bg-teal-400/25",
    badge: "from-teal-400 to-emerald-400",
  },
  violet: {
    ring: "hover:border-violet-400/60",
    glow: "group-hover:bg-violet-400/25",
    badge: "from-violet-400 to-fuchsia-400",
  },
  amber: {
    ring: "hover:border-amber-400/60",
    glow: "group-hover:bg-amber-400/25",
    badge: "from-amber-400 to-orange-400",
  },
  slate: {
    ring: "hover:border-slate-400/60",
    glow: "group-hover:bg-slate-400/20",
    badge: "from-slate-400 to-slate-300",
  },
};

export function SubscriptionPlanCard({
  plan,
  cycle,
  index,
}: {
  plan: Plan;
  cycle: "monthly" | "yearly";
  index: number;
}) {
  const router = useRouter();
  const a = accentStyles[plan.accent];
  const isCustom = plan.priceMonthly === null;
  const handleSelect = () => {
    if (isCustom) {
      router.push(ROUTES.contact);
      return;
    }
    sessionStorage.setItem(BILLING_CYCLE_STORAGE_KEY, cycle);
    const params = new URLSearchParams({ plan: plan.id, cycle });
    router.push(`${ROUTES.subscriptionCheckout}?${params.toString()}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -14, scale: 1.015 }}
      className={`group relative glass rounded-3xl p-8 flex flex-col h-full overflow-hidden transition-all duration-300 ${plan.popular ? "border-phause-cyan/50 shadow-[0_0_50px_rgba(0,216,201,0.15)] lg:scale-[1.04] lg:-translate-y-2" : a.ring} hover:shadow-[0_0_50px_rgba(0,216,201,0.12)]`}
    >
      <div
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] transition-all duration-500 ${a.glow} bg-phause-cyan/10`}
      />
      {plan.popular && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute top-0 left-1/2 -translate-x-1/2"
        >
          <div className="flex items-center gap-1.5 px-5 py-1.5 rounded-b-2xl bg-gradient-to-r from-phause-cyan to-phause-teal text-phause-dark text-xs font-black tracking-wider uppercase">
            <Crown className="w-3.5 h-3.5" /> Most Popular
          </div>
        </motion.div>
      )}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4 mt-2">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.7 }}
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.badge} flex items-center justify-center shadow-[0_0_20px_rgba(0,216,201,0.3)]`}
          >
            {plan.name.toLowerCase().includes("free") && (
              <Shield className="w-6 h-6 text-phause-dark" />
            )}
            {plan.name.toLowerCase().includes("starter") && (
              <Rocket className="w-6 h-6 text-phause-dark" />
            )}
            {plan.name.toLowerCase().includes("professional") && (
              <ShieldCheck className="w-6 h-6 text-phause-dark" />
            )}
            {plan.name.toLowerCase().includes("enterprise") && (
              <ShieldCheck className="w-6 h-6 text-phause-dark" />
            )}
            {!["free", "starter", "professional", "enterprise"].some((name) =>
              plan.name.toLowerCase().includes(name),
            ) && <Landmark className="w-6 h-6 text-phause-dark" />}
          </motion.div>
          <div>
            <h3 className="text-xl font-extrabold">{plan.name}</h3>
            <p className="text-xs text-phause-cyan font-semibold uppercase tracking-wider">
              Tier {String(index + 1).padStart(2, "0")}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed mb-6 min-h-[60px]">
          {plan.tagline}
        </p>
        <div className="mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={cycle}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex items-end gap-2"
            >
              <span className="text-5xl font-black text-gradient">
                {formatPrice(plan, cycle)}
              </span>
              {!isCustom && (
                <span className="text-slate-400 text-sm mb-1.5">/ month</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {plan.stats.map((stat, statIndex) => (
            <div
              key={`${stat.label}-${statIndex}`}
              className="rounded-xl bg-phause-cyan/[0.06] border border-phause-cyan/10 px-3 py-2.5 hover:border-phause-cyan/30 transition-colors"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {stat.label}
              </p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-2.5 mb-8 flex-1">
          {plan.features.map((feature, featureIndex) => (
            <div
              key={`${feature.label}-${featureIndex}`}
              className="flex items-start gap-2.5"
            >
              {feature.included ? (
                <Check className="w-4 h-4 text-phause-cyan shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              )}
              <span
                className={`text-sm leading-snug ${feature.included ? "text-slate-300" : "text-slate-600 line-through"}`}
              >
                {feature.label}
              </span>
            </div>
          ))}
        </div>
        <motion.button
          onClick={handleSelect}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`relative w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 overflow-hidden ${plan.popular || plan.accent === "amber" ? "bg-gradient-to-r from-phause-cyan to-phause-teal text-phause-dark shadow-[0_0_30px_rgba(0,216,201,0.4)]" : "glass border border-phause-cyan/30 text-phause-cyan hover:bg-phause-cyan/10"}`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {plan.cta} <ArrowRight className="w-4 h-4" />
          </span>
          {plan.popular && (
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export function SubscriptionPlanSection({
  plans,
  isLoading,
  error,
}: {
  plans: Plan[];
  isLoading: boolean;
  error: string | null;
}) {
  const cycle = "monthly";
  return (
    <section id="pricing" className="relative py-28 overflow-hidden">
      <div className="absolute left-1/2 top-24 w-[700px] h-[500px] rounded-full bg-phause-cyan/8 blur-[160px] -translate-x-1/2" />
      <div className="relative z-10 max-w-[90rem] mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase bg-phause-cyan/10 text-phause-cyan border border-phause-cyan/20 mb-4">
            Choose Your Shield
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
            Plans that scale with{" "}
            <span className="text-gradient">your security</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Choose the right protection for your team. Upgrade whenever your
            security requirements grow.
          </p>
        </div>
        <div className="flex justify-center mb-14">
          <div className="glass rounded-full px-6 py-3 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-phause-cyan animate-pulse" />
            <span className="text-sm font-semibold text-slate-300">
              Monthly Subscription Plans
            </span>
          </div>
        </div>
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-5 rounded-2xl border border-red-500/20 bg-red-500/10 text-center">
            <p className="text-red-400 text-sm">
              Unable to load subscription plans.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-semibold text-phause-cyan"
            >
              Try Again
            </button>
          </div>
        )}
        {isLoading && (
          <div className="flex flex-wrap justify-center items-stretch gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="glass rounded-3xl p-8 animate-pulse min-h-[520px] w-full max-w-sm sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[22rem]"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 mb-6" />
                <div className="h-5 w-32 bg-white/10 rounded mb-4" />
                <div className="h-3 w-full bg-white/10 rounded mb-2" />
                <div className="h-3 w-2/3 bg-white/10 rounded mb-10" />
                <div className="h-12 w-40 bg-white/10 rounded mb-8" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && !error && plans.length > 0 && (
          <motion.div
            layout
            className="flex flex-wrap justify-center items-stretch gap-6"
          >
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className="flex w-full max-w-sm sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[22rem]"
              >
                <SubscriptionPlanCard plan={plan} cycle={cycle} index={index} />
              </div>
            ))}
          </motion.div>
        )}
        {!isLoading && !error && plans.length === 0 && (
          <div className="glass rounded-3xl py-20 text-center">
            <Shield className="w-12 h-12 text-phause-cyan mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Plans coming soon</h3>
            <p className="text-slate-400 text-sm">Please check back later.</p>
          </div>
        )}
      </div>
    </section>
  );
}
