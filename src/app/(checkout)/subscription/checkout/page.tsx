"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    BadgeCheck,
    Check,
    CreditCard,
    ExternalLink,
    Loader2,
    Lock,
    Shield,
    ShieldCheck,
    Sparkles,
    X,
} from "lucide-react";

import { ROUTES } from "@/lib/routes";
import { getToken } from "@/lib/auth";
import { planService } from "@/services/planService";
import type { SubscriptionPlanResponse } from "@/types/plan";

type PaymentProvider = "stripe" | "razorpay" | "paypal";
type PlanLoadResult = {
    planId: string;
    plan: SubscriptionPlanResponse | null;
    error: string;
};

const PROVIDERS: {
    id: PaymentProvider;
    name: string;
    description: string;
}[] = [
    {
        id: "stripe",
        name: "Stripe",
        description: "Pay securely using Stripe.",
    },
    {
        id: "razorpay",
        name: "Razorpay",
        description: "Pay using supported local payment methods.",
    },
    {
        id: "paypal",
        name: "PayPal",
        description: "Continue securely with PayPal.",
    },
];

function GridBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(0,216,201,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,216,201,0.3) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            <motion.div
                className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-phause-teal/15 blur-[160px]"
                animate={{ x: [0, 80, 0], y: [0, 50, 0] }}
                transition={{
                    duration: 14,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[160px]"
                animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
}

function formatCurrency(price: string | number, currency: string) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
        return "Price unavailable";
    }

    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency.toUpperCase(),
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency.toUpperCase()} ${amount.toLocaleString("en-IN")}`;
    }
}

function getCheckoutUrl(value: unknown): string | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const record = value as Record<string, unknown>;

    // Support common response property names.
    const possibleUrlKeys = [
        "checkoutUrl",
        "checkout_url",
        "paymentUrl",
        "payment_url",
        "redirectUrl",
        "redirect_url",
        "url",
        "sessionUrl",
        "session_url",
    ];

    for (const key of possibleUrlKeys) {
        const candidate = record[key];

        if (typeof candidate === "string" && candidate.trim()) {
            return candidate;
        }
    }

    // Some APIs wrap their response inside data/result/session.
    for (const key of ["data", "result", "session", "checkout", "payment"]) {
        const nestedUrl = getCheckoutUrl(record[key]);

        if (nestedUrl) {
            return nestedUrl;
        }
    }

    return null;
}

function getErrorMessage(value: unknown): string {
    if (!value || typeof value !== "object") {
        return "Something went wrong. Please try again.";
    }

    const record = value as Record<string, unknown>;

    if (typeof record.message === "string") {
        return record.message;
    }

    if (typeof record.error === "string") {
        return record.error;
    }

    return "Unable to start checkout. Please try again.";
}

function isSafeCheckoutUrl(value: string) {
    try {
        const url = new URL(value);

        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

function LoadingScreen({ message }: { message: string }) {
    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-phause-dark px-6 text-white">
            <GridBackground />

            <div className="glass relative z-10 flex items-center gap-3 rounded-2xl px-6 py-5">
                <Loader2 className="h-5 w-5 animate-spin text-phause-cyan" />
                <span className="text-sm text-slate-300">{message}</span>
            </div>
        </main>
    );
}

function CheckoutInner() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const planId = searchParams.get("plan");

    const [planLoadResult, setPlanLoadResult] =
        useState<PlanLoadResult | null>(null);
    const [provider, setProvider] = useState<PaymentProvider>("stripe");

    const [checkoutLoading, setCheckoutLoading] = useState(false);

    const [checkoutError, setCheckoutError] = useState<{
        planId: string | null;
        message: string;
    } | null>(null);
    const [step, setStep] = useState<"plan" | "payment">("plan");

    const currentPlanLoad =
        planId && planLoadResult?.planId === planId ? planLoadResult : null;
    const plan = currentPlanLoad?.plan ?? null;
    const loadingPlan = Boolean(planId) && currentPlanLoad === null;
    const planError = planId
        ? currentPlanLoad?.error ?? ""
        : "No subscription plan was selected. Please select a plan first.";
    const error =
        planError ||
        (checkoutError?.planId === planId ? checkoutError.message : "");
    const setError = (message: string) =>
        setCheckoutError({ planId, message });

    const price = useMemo(() => {
        if (!plan) return "";

        return formatCurrency(plan.price, plan.currency);
    }, [plan]);

    useEffect(() => {
        if (!planId) return;

        let active = true;

        const loadSelectedPlan = async () => {
            try {
                // Fetch the current plans from the existing plans API.
                // This avoids calling the missing /api/plans/[id] route.
                const plans = await planService.getPlans();
                if (!active) return;

                const selectedPlan = plans.find(
                    (item) => item.id === planId && item.isActive,
                );

                setPlanLoadResult({
                    planId,
                    plan: selectedPlan ?? null,
                    error: selectedPlan
                        ? ""
                        : "This plan is no longer available. Please return to the subscription page and choose another plan.",
                });
            } catch (err) {
                if (!active) return;

                setPlanLoadResult({
                    planId,
                    plan: null,
                    error:
                        err instanceof Error
                            ? err.message
                            : "Unable to load the selected subscription plan.",
                });
            }
        };

        void loadSelectedPlan();

        return () => {
            active = false;
        };
    }, [planId]);

    const handleCheckout = async () => {
        if (!plan) {
            setError("Please select a valid subscription plan.");
            return;
        }

        const token = getToken();

        if (!token) {
            setError(
                "Your session could not be verified. Please sign in again before continuing to checkout.",
            );
            return;
        }

        setCheckoutLoading(true);
        setError("");

        try {
            const response = await fetch("/api/subscriptions/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    planId: plan.id,
                    provider,
                }),
            });

            const result: unknown = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(getErrorMessage(result));
            }

            const checkoutUrl = getCheckoutUrl(result);

            if (!checkoutUrl || !isSafeCheckoutUrl(checkoutUrl)) {
                throw new Error(
                    "The checkout service did not return a valid payment URL. Please contact support.",
                );
            }

            // Redirect to the hosted payment page returned by the backend.
            window.location.assign(checkoutUrl);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to start checkout. Please try again.",
            );

            setCheckoutLoading(false);
        }
    };

    if (loadingPlan) {
        return <LoadingScreen message="Loading your selected plan..." />;
    }

    if (!plan) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-phause-dark px-6 py-20 text-white">
                <GridBackground />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass relative z-10 w-full max-w-lg rounded-3xl p-8 text-center"
                >
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10">
                        <X className="h-8 w-8 text-red-400" />
                    </div>

                    <h1 className="text-2xl font-black">
                        Plan unavailable
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-400">
                        {error || "We could not find the selected subscription plan."}
                    </p>

                    <button
                        type="button"
                        onClick={() => router.push(ROUTES.subscription)}
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-phause-cyan to-phause-teal px-6 py-3 font-bold text-phause-dark transition hover:scale-[1.02]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to plans
                    </button>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-phause-dark pb-20 pt-28 text-white">
            <GridBackground />

            <div className="pointer-events-none fixed inset-0 z-0">
                {Array.from({ length: 20 }).map((_, index) => (
                    <motion.span
                        key={index}
                        className="absolute h-1 w-1 rounded-full bg-phause-cyan"
                        style={{
                            left: `${(index * 37) % 100}%`,
                            top: `${(index * 53) % 100}%`,
                            opacity: 0.35,
                        }}
                        animate={{
                            y: [0, -35, 0],
                            opacity: [0.1, 0.65, 0.1],
                        }}
                        transition={{
                            duration: 3 + (index % 5),
                            repeat: Infinity,
                            delay: (index % 7) * 0.5,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <button
                        type="button"
                        onClick={() => router.push(ROUTES.subscription)}
                        className="mb-6 inline-flex items-center gap-2 text-sm text-phause-cyan transition hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to plans
                    </button>

                    <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-5 py-2 text-sm text-phause-cyan">
                        <Sparkles className="h-4 w-4" />
                        Secure Checkout
                    </div>

                    <h1 className="text-4xl font-black md:text-6xl">
                        Almost{" "}
                        <span className="text-gradient">there.</span>
                    </h1>

                    <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                        Review your subscription and continue to our secure
                        payment provider to complete your purchase.
                    </p>
                </motion.div>

                <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
                    {/* Main checkout content */}
                    <div>
                        {/* Progress */}
                        <div className="mb-9 flex items-center justify-center gap-4 sm:gap-8">
                            {[
                                { id: "plan", label: "Review plan" },
                                { id: "payment", label: "Payment" },
                            ].map((item, index) => {
                                const active = step === item.id;
                                const completed =
                                    step === "payment" && item.id === "plan";

                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                                                active || completed
                                                    ? "border-phause-cyan/40 bg-phause-cyan/15 text-phause-cyan shadow-[0_0_25px_rgba(0,216,201,0.15)]"
                                                    : "border-phause-border bg-white/[0.03] text-slate-500"
                                            }`}
                                        >
                                            {completed ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                <span className="text-sm font-bold">
                                                    {index + 1}
                                                </span>
                                            )}
                                        </div>

                                        <span
                                            className={`text-xs font-bold sm:text-sm ${
                                                active || completed
                                                    ? "text-phause-cyan"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <AnimatePresence mode="wait">
                            {step === "plan" ? (
                                <motion.section
                                    key="plan"
                                    initial={{ opacity: 0, x: 35 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -35 }}
                                    transition={{ duration: 0.3 }}
                                    className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8"
                                >
                                    <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-phause-cyan/10 blur-[80px]" />

                                    <div className="relative z-10">
                                        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-phause-cyan to-phause-teal shadow-[0_0_25px_rgba(0,216,201,0.25)]">
                                                    <ShieldCheck className="h-7 w-7 text-phause-dark" />
                                                </div>

                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-widest text-phause-cyan">
                                                        Selected plan
                                                    </p>
                                                    <h2 className="mt-1 text-2xl font-black">
                                                        {plan.name}
                                                    </h2>
                                                </div>
                                            </div>

                                            <span className="rounded-full border border-phause-teal/30 bg-phause-teal/10 px-3 py-1.5 text-xs font-bold text-phause-teal">
                                                {plan.billingCycle}
                                            </span>
                                        </div>

                                        <p className="mb-7 text-sm leading-6 text-slate-400">
                                            {plan.description}
                                        </p>

                                        <div className="space-y-4 rounded-2xl border border-phause-cyan/15 bg-phause-cyan/[0.045] p-5 sm:p-6">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-slate-400">
                                                    Subscription price
                                                </span>

                                                <span className="text-xl font-black text-white">
                                                    {price}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-slate-400">
                                                    Billing cycle
                                                </span>

                                                <span className="text-sm font-bold text-slate-200">
                                                    {plan.billingCycle}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-slate-400">
                                                    Free trial
                                                </span>

                                                <span className="text-sm font-bold text-phause-teal">
                                                    {plan.trialDays > 0
                                                        ? `${plan.trialDays} days`
                                                        : "Not included"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-slate-400">
                                                    Maximum campaigns
                                                </span>

                                                <span className="text-sm font-bold text-slate-200">
                                                    {plan.maxCampaigns === 0
                                                        ? "Unlimited"
                                                        : plan.maxCampaigns.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-slate-400">
                                                    Maximum users
                                                </span>

                                                <span className="text-sm font-bold text-slate-200">
                                                    {plan.maxUsers === 0
                                                        ? "Unlimited"
                                                        : plan.maxUsers.toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="border-t border-phause-cyan/15 pt-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="font-bold text-slate-200">
                                                        Plan total
                                                    </span>

                                                    <span className="text-2xl font-black text-gradient">
                                                        {price}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-phause-cyan/10 bg-white/[0.025] p-4">
                                            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-phause-cyan" />

                                            <p className="text-xs leading-5 text-slate-400">
                                                Your payment will be handled by
                                                the selected payment provider.
                                                Phause does not ask you to enter
                                                your card details on this page.
                                            </p>
                                        </div>

                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                setError("");
                                                setStep("payment");
                                            }}
                                            whileHover={{ scale: 1.015 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-phause-cyan to-phause-teal py-4 font-bold text-phause-dark shadow-[0_0_35px_rgba(0,216,201,0.25)] transition-shadow hover:shadow-[0_0_45px_rgba(0,216,201,0.4)]"
                                        >
                                            Continue to payment
                                            <ArrowRight className="h-5 w-5" />
                                        </motion.button>
                                    </div>
                                </motion.section>
                            ) : (
                                <motion.section
                                    key="payment"
                                    initial={{ opacity: 0, x: 35 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -35 }}
                                    transition={{ duration: 0.3 }}
                                    className="glass rounded-3xl p-6 sm:p-8"
                                >
                                    <div className="mb-7 flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-phause-cyan/20 bg-phause-cyan/10">
                                            <CreditCard className="h-6 w-6 text-phause-cyan" />
                                        </div>

                                        <div>
                                            <h2 className="text-xl font-black">
                                                Select payment provider
                                            </h2>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Choose how you want to complete
                                                your payment.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {PROVIDERS.map((item) => {
                                            const selected =
                                                provider === item.id;

                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setProvider(item.id);
                                                        setError("");
                                                    }}
                                                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-5 text-left transition-all ${
                                                        selected
                                                            ? "border-phause-cyan/50 bg-phause-cyan/[0.09] shadow-[0_0_25px_rgba(0,216,201,0.08)]"
                                                            : "border-white/[0.08] bg-white/[0.025] hover:border-phause-cyan/25 hover:bg-white/[0.045]"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                                                                selected
                                                                    ? "bg-phause-cyan/15 text-phause-cyan"
                                                                    : "bg-white/[0.05] text-slate-400"
                                                            }`}
                                                        >
                                                            <CreditCard className="h-5 w-5" />
                                                        </div>

                                                        <div>
                                                            <p className="font-bold text-white">
                                                                {item.name}
                                                            </p>

                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                                            selected
                                                                ? "border-phause-cyan bg-phause-cyan"
                                                                : "border-slate-600"
                                                        }`}
                                                    >
                                                        {selected && (
                                                            <Check className="h-3 w-3 text-phause-dark" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-5 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-300"
                                            role="alert"
                                        >
                                            <X className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{error}</span>
                                        </motion.div>
                                    )}

                                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setError("");
                                                setStep("plan");
                                            }}
                                            disabled={checkoutLoading}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-phause-cyan/25 px-6 py-4 font-bold text-phause-cyan transition hover:bg-phause-cyan/5 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </button>

                                        <motion.button
                                            type="button"
                                            onClick={handleCheckout}
                                            disabled={checkoutLoading}
                                            whileHover={
                                                checkoutLoading
                                                    ? undefined
                                                    : { scale: 1.015 }
                                            }
                                            whileTap={
                                                checkoutLoading
                                                    ? undefined
                                                    : { scale: 0.98 }
                                            }
                                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-phause-cyan to-phause-teal py-4 font-bold text-phause-dark shadow-[0_0_35px_rgba(0,216,201,0.25)] transition disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            {checkoutLoading ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    Creating secure checkout...
                                                </>
                                            ) : (
                                                <>
                                                    Continue to {provider}
                                                    <ExternalLink className="h-4 w-4" />
                                                </>
                                            )}
                                        </motion.button>
                                    </div>

                                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                                        <Shield className="h-4 w-4 text-phause-teal" />
                                        Secure payment handled by {provider}.
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Order summary */}
                    <motion.aside
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="lg:sticky lg:top-24"
                    >
                        <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-7">
                            <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-phause-cyan/10 blur-[70px]" />

                            <div className="relative z-10">
                                <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-phause-cyan">
                                    <BadgeCheck className="h-4 w-4" />
                                    Order summary
                                </h3>

                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-phause-cyan to-phause-teal">
                                        <Shield className="h-5 w-5 text-phause-dark" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-white">
                                            {plan.name}
                                        </p>

                                        <p className="text-xs text-slate-500">
                                            {plan.billingCycle} subscription
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 border-t border-phause-border/60 pt-5 text-sm">
                                    <div className="flex justify-between gap-3 text-slate-400">
                                        <span>Plan price</span>
                                        <span className="font-bold text-slate-200">
                                            {price}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-3 text-slate-400">
                                        <span>Trial period</span>
                                        <span className="font-bold text-phause-teal">
                                            {plan.trialDays > 0
                                                ? `${plan.trialDays} days`
                                                : "None"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-3 text-slate-400">
                                        <span>Payment provider</span>
                                        <span className="font-bold capitalize text-slate-200">
                                            {provider}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-3 border-t border-phause-border/60 pt-4 text-base font-black">
                                        <span>Total</span>
                                        <span className="text-gradient">
                                            {price}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-7 space-y-3">
                                    {[
                                        "Secure hosted payment page",
                                        "Encrypted payment processing",
                                        "Subscription managed by Phause",
                                    ].map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center gap-2.5 text-xs text-slate-400"
                                        >
                                            <Check className="h-4 w-4 shrink-0 text-phause-teal" />
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </div>
            </div>

            {/* Checkout loading overlay */}
            <AnimatePresence>
                {checkoutLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-phause-dark/80 px-5 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass w-full max-w-sm rounded-3xl p-9 text-center"
                        >
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-phause-cyan/20 bg-phause-cyan/10">
                                <Loader2 className="h-8 w-8 animate-spin text-phause-cyan" />
                            </div>

                            <h3 className="text-xl font-black">
                                Preparing secure checkout
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                Connecting to {provider} and creating your
                                payment session. Please do not close this page.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <LoadingScreen message="Loading secure checkout..." />
            }
        >
            <CheckoutInner />
        </Suspense>
    );
}