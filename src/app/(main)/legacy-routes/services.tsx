"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { getBlockProp } from "@/features/cms/page-builder"
import {
    ArrowDown,
    ArrowRight,
    ArrowUpRight,
    ShieldCheck,
    Mail,
    Search,
    GraduationCap,
    ClipboardCheck,
    Users,
    Building2,
    Globe,
    Network,
    Check,
    X,
    ChevronDown,
    LockKeyhole,
    Activity,
    Target,
    FileSearch,
    BriefcaseBusiness,
    Headphones,
    Workflow,
    CheckCircle2,
} from "lucide-react"

type Service = {
    number: string
    title: string
    description: string
    icon: React.ElementType
    image: string
    overview: string
    features: string[]
    suitableFor: string
}


const defaultHeroProps = {
    eyebrow: undefined as string | undefined,
    title: undefined as string | undefined,
    description: undefined as string | undefined,
}

const defaultItemCollection = [] as Array<Record<string, unknown>>

function normalizeCmsBlockType(value: string) {
    return String(value).replace(/[_-]+/g, "").toLowerCase();
}

function findCmsBlock(blocks: Array<Record<string, unknown>>, ...types: string[]) {
    return blocks.find((block) => types.some((type) => normalizeCmsBlockType(String(block.type ?? "")) === normalizeCmsBlockType(type))) ?? null;
}

const serviceIconLookup: Record<string, React.ElementType> = {
    phishing: GraduationCap,
    awareness: GraduationCap,
    assessment: Mail,
    detection: Search,
    training: ShieldCheck,
    readiness: ClipboardCheck,
    default: ShieldCheck,
};

const processIconLookup: Record<string, React.ElementType> = {
    understand: Target,
    assess: FileSearch,
    recommend: Workflow,
    improve: CheckCircle2,
    default: Workflow,
};

const audienceIconLookup: Record<string, React.ElementType> = {
    growing: Building2,
    enterprise: Network,
    security: LockKeyhole,
    remote: Globe,
    operations: Activity,
    leadership: BriefcaseBusiness,
    default: Users,
};

const benefitIconLookup: Record<string, React.ElementType> = {
    focus: ShieldCheck,
    approach: Users,
    recommendations: CheckCircle2,
    connected: Network,
    tailored: Target,
    improvement: Activity,
    default: ShieldCheck,
};

function resolveIcon(iconName: string | undefined, lookup: Record<string, React.ElementType>, fallback: React.ElementType) {
    if (!iconName) return fallback;
    const normalized = iconName.toLowerCase().replace(/[^a-z]/g, "");
    return lookup[normalized] ?? lookup.default ?? fallback;
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function toArray(value: unknown): Array<Record<string, unknown>> {
    return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function ServiceModal({
    service,
    onClose,
}: {
    service: Service | null
    onClose: () => void
}) {
    const reduceMotion = useReducedMotion()

    return (
        <AnimatePresence>
            {service && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) onClose()
                    }}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="service-modal-title"
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: 30, scale: 0.96 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ duration: reduceMotion ? 0 : 0.3 }}
                        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#101D2B] shadow-2xl"
                    >
                        <div className="relative h-52 overflow-hidden sm:h-64">
                            <Image
                                src={service.image}
                                alt={service.title}
                                fill
                                priority
                                className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#101D2B] via-[#101D2B]/30 to-transparent" />

                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close service details"
                                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/70"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <span className="absolute bottom-5 left-6 rounded-full border border-phause-cyan/30 bg-phause-cyan/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-phause-cyan">
                                Service {service.number}
                            </span>
                        </div>

                        <div className="px-6 pb-8 sm:px-9">
                            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-phause-cyan/20 bg-phause-cyan/10">
                                <service.icon className="h-7 w-7 text-phause-cyan" />
                            </div>

                            <h2
                                id="service-modal-title"
                                className="text-2xl font-bold text-white sm:text-3xl"
                            >
                                {service.title}
                            </h2>

                            <p className="mt-4 text-sm leading-7 text-slate-400 sm:text-base">
                                {service.overview}
                            </p>

                            <h3 className="mb-4 mt-7 text-lg font-bold text-white">
                                What this service covers
                            </h3>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {service.features.map((feature) => (
                                    <div key={feature} className="flex items-start gap-3">
                                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-phause-cyan/10">
                                            <Check className="h-3 w-3 text-phause-cyan" />
                                        </span>
                                        <span className="text-sm leading-relaxed text-slate-300">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                <h4 className="mb-2 font-semibold text-phause-cyan">
                                    Who is it for?
                                </h4>
                                <p className="text-sm leading-6 text-slate-400">
                                    {service.suitableFor}
                                </p>
                            </div>

                            <Link
                                href="/contact"
                                onClick={onClose}
                                className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal px-7 py-4 font-bold text-phause-dark transition hover:-translate-y-0.5"
                            >
                                Discuss This Service
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default function ServicesPage() {
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [activeFaq, setActiveFaq] = useState<number | null>(0)
    const [page, setPage] = useState<Record<string, unknown> | null>(null)
    const [cmsServices, setCmsServices] = useState<Array<Record<string, unknown>>>([])
    const [cmsFaqs, setCmsFaqs] = useState<Array<{ question: string; answer: string }>>([])
    const reduceMotion = useReducedMotion()

    useEffect(() => {
        fetch("/api/cms/pages?slug=services")
            .then((response) => response.json())
            .then((payload) => setPage(payload.page ?? null))
            .catch(() => setPage(null));

        fetch("/api/cms/services?published=true")
            .then((response) => response.json())
            .then((payload) => {
                if (Array.isArray(payload.items)) {
                    setCmsServices(payload.items.filter((item: Record<string, unknown>) => String(item.status ?? "DRAFT").toUpperCase() === "PUBLISHED"));
                }
            })
            .catch(() => setCmsServices([]));

        fetch("/api/cms/faqs")
            .then((response) => response.json())
            .then((payload) => {
                if (Array.isArray(payload.items)) {
                    setCmsFaqs(payload.items.filter((item: Record<string, unknown>) => String(item.status ?? "DRAFT").toUpperCase() === "PUBLISHED").map((item: Record<string, unknown>) => ({
                        question: String(item.question ?? ""),
                        answer: String(item.answer ?? ""),
                    })));
                }
            })
            .catch(() => setCmsFaqs([]));
    }, []);

    const pageBlocks = Array.isArray(page?.blocks) ? (page.blocks as Array<Record<string, unknown>>) : defaultItemCollection;
    const heroBlock = findCmsBlock(pageBlocks, "servicesHero", "hero")?.props as Record<string, unknown> | undefined;
    const servicesBlock = findCmsBlock(pageBlocks, "servicesFeatures", "services")?.props as Record<string, unknown> | undefined;
    const processBlock = findCmsBlock(pageBlocks, "servicesProcess")?.props as Record<string, unknown> | undefined;
    const audiencesBlock = findCmsBlock(pageBlocks, "servicesAudiences")?.props as Record<string, unknown> | undefined;
    const benefitsBlock = findCmsBlock(pageBlocks, "servicesBenefits")?.props as Record<string, unknown> | undefined;
    const statsBlock = findCmsBlock(pageBlocks, "servicesStats", "stats")?.props as Record<string, unknown> | undefined;
    const faqBlock = findCmsBlock(pageBlocks, "servicesFaq", "faq")?.props as Record<string, unknown> | undefined;

    const hero = {
        eyebrow: getBlockProp(heroBlock ?? defaultHeroProps, "eyebrow", defaultHeroProps.eyebrow ?? ""),
        title: getBlockProp(heroBlock ?? defaultHeroProps, "title", defaultHeroProps.title ?? ""),
        description: getBlockProp(heroBlock ?? defaultHeroProps, "description", defaultHeroProps.description ?? ""),
    };

    const cmsServicesMapped = toArray(servicesBlock?.items ?? []).map((item, index) => {
        const record = item as Record<string, unknown>;
        const iconName = String(record.icon ?? record.title ?? "");
        return {
            number: String(record.number ?? `${index + 1}`.padStart(2, "0")),
            title: String(record.title ?? ""),
            description: String(record.description ?? ""),
            image: String(record.image ?? ""),
            overview: String(record.overview ?? record.description ?? ""),
            features: Array.isArray(record.features) ? record.features.map((feature) => String(feature)) : [],
            suitableFor: String(record.suitableFor ?? ""),
            icon: resolveIcon(iconName, serviceIconLookup, ShieldCheck),
        } as Service;
    });

    const resourceServices = cmsServices.length > 0 ? cmsServices.map((item, index) => ({
        number: String(index + 1).padStart(2, "0"),
        title: String(item.title ?? ""),
        description: String(item.description ?? ""),
        image: String(item.image ?? ""),
        overview: String(item.description ?? ""),
        features: [],
        suitableFor: "",
        icon: ShieldCheck,
    } as Service)) : [];

    const cmsProcessSteps = toArray(processBlock?.items ?? []).map((item, index) => {
        const record = item as Record<string, unknown>;
        const iconName = String(record.title ?? record.label ?? "");
        return {
            number: String(record.number ?? `${index + 1}`.padStart(2, "0")),
            title: String(record.title ?? ""),
            description: String(record.description ?? ""),
            icon: resolveIcon(iconName, processIconLookup, Workflow),
        };
    });

    const cmsAudiences = toArray(audiencesBlock?.items ?? []).map((item) => {
        const record = item as Record<string, unknown>;
        const title = String(record.title ?? "");
        return {
            title,
            description: String(record.description ?? ""),
            icon: resolveIcon(String(record.icon ?? title), audienceIconLookup, Users),
        };
    });

    const cmsBenefits = toArray(benefitsBlock?.items ?? []).map((item) => {
        const record = item as Record<string, unknown>;
        const title = String(record.title ?? "");
        return {
            title,
            description: String(record.description ?? ""),
            icon: resolveIcon(String(record.icon ?? title), benefitIconLookup, ShieldCheck),
        };
    });

    const cmsHighlights = toArray(statsBlock?.items ?? []).map((item) => {
        const record = item as Record<string, unknown>;
        const title = String(record.title ?? record.label ?? record.value ?? "");
        return {
            title,
            text: String(record.description ?? record.text ?? record.label ?? ""),
            icon: resolveIcon(String(record.icon ?? title), serviceIconLookup, ShieldCheck),
        };
    });

    const cmsFaqsMapped = toArray(faqBlock?.items ?? []).map((item) => ({
        question: String((item as Record<string, unknown>).question ?? ""),
        answer: String((item as Record<string, unknown>).answer ?? ""),
    }));

    const renderedServices = resourceServices.length ? resourceServices : cmsServicesMapped.length ? cmsServicesMapped : [];
    const renderedProcessSteps = cmsProcessSteps.length ? cmsProcessSteps : [];
    const renderedAudiences = cmsAudiences.length ? cmsAudiences : [];
    const renderedBenefits = cmsBenefits.length ? cmsBenefits : [];
    const renderedHighlights = cmsHighlights.length ? cmsHighlights : [];
    const renderedFaqs = cmsFaqs.length ? cmsFaqs : cmsFaqsMapped.length ? cmsFaqsMapped : [];

    return (
        <main className="overflow-hidden bg-[#081522] text-white">

            {/* 1. HERO */}
            <section className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-40 top-10 h-[500px] w-[500px] rounded-full bg-phause-cyan/[0.09] blur-[150px]" />
                    <div className="absolute -left-40 bottom-0 h-[400px] w-[400px] rounded-full bg-phause-teal/[0.07] blur-[140px]" />
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-phause-cyan/20 to-transparent" />
                </div>

                <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
                            <Link href="/" className="transition hover:text-phause-cyan">
                                Home
                            </Link>
                            <span>/</span>
                            <span className="text-phause-cyan">Services</span>
                        </nav>

                        <span className="inline-flex items-center gap-2 rounded-full border border-phause-cyan/20 bg-phause-cyan/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-phause-cyan">
                            <BriefcaseBusiness className="h-4 w-4" />
                            {hero.eyebrow}
                        </span>

                        <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                            {hero.title}
                        </h1>

                        <p className="mt-7 max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
                            {hero.description}
                        </p>

                        <div className="mt-9 flex flex-wrap gap-4">
                            <a
                                href="#services"
                                className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal px-7 py-4 font-bold text-phause-dark shadow-[0_8px_30px_rgba(0,216,201,0.15)] transition hover:-translate-y-1 hover:shadow-[0_10px_35px_rgba(0,216,201,0.28)]"
                            >
                                Explore Services
                                <ArrowDown className="h-5 w-5" />
                            </a>

                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-7 py-4 font-semibold text-white transition hover:border-phause-cyan/40 hover:bg-phause-cyan/[0.06]"
                            >
                                Talk to Our Team
                                <ArrowRight className="h-5 w-5 text-phause-cyan" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Hero glance panel */}
                    <motion.aside
                        initial={{ opacity: 0, x: 25 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.15 }}
                        className="relative rounded-3xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl"
                    >
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-phause-cyan/10 blur-[70px]" />

                        <div className="relative space-y-3">
                            {renderedHighlights.map((item, index) => {
                                const Icon = item.icon ?? ShieldCheck;

                                return (
                                    <motion.div
                                        key={item.title || `highlight-${index}`}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 + index * 0.12 }}
                                        className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-[#101F2E] p-5 transition hover:translate-x-1 hover:border-phause-cyan/20"
                                    >
                                        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-phause-cyan/15 bg-phause-cyan/10">
                                            <Icon className="h-6 w-6 text-phause-cyan" />
                                        </span>
                                        <div>
                                            <h3 className="font-bold text-white">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {item.text}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.aside>
                </div>
            </section>

            {/* 2. SERVICES GRID */}
            <section id="services" className="bg-[#0B1927] py-20 md:py-28">
                <div className="mx-auto max-w-7xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="mx-auto mb-14 max-w-3xl text-center"
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-phause-cyan/20 bg-phause-cyan/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-phause-cyan">
                            <ShieldCheck className="h-4 w-4" />
                            What We Offer
                        </span>

                        <h2 className="mt-6 text-3xl font-extrabold sm:text-4xl md:text-5xl">
                            Five services,{" "}
                            <span className="text-gradient">
                                one connected approach.
                            </span>
                        </h2>

                        <p className="mt-5 text-base leading-7 text-slate-400">
                            Explore our service areas to understand what each
                            covers, how it can help and who it is designed for.
                        </p>
                    </motion.div>

                    <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-6">
                        {renderedServices.map((service, index) => (
                            <motion.article
                                key={`${service.number}-${index}`}
                                id={slugify(service.title)}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.08 }}
                                className={`group overflow-hidden rounded-3xl border border-white/[0.08] bg-[#101F2E] transition duration-300 hover:-translate-y-2 hover:border-phause-cyan/30 hover:shadow-[0_20px_55px_rgba(0,216,201,0.08)] ${
                                    index < 3
                                        ? "lg:col-span-2"
                                        : "lg:col-span-3"
                                }`}
                            >
                                <div className="relative h-56 overflow-hidden">
                                    {service.image ? (
                                        <Image
                                            src={service.image}
                                            alt={service.title}
                                            fill
                                            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-phause-cyan/10 via-[#101F2E] to-[#0B1927]">
                                            <service.icon className="h-12 w-12 text-phause-cyan/70" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#101F2E] via-[#101F2E]/15 to-transparent" />

                                    <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-bold tracking-widest text-white backdrop-blur-md">
                                        {service.number}
                                    </span>
                                </div>

                                <div className="relative p-6 sm:p-7">
                                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-phause-cyan/15 bg-phause-cyan/10">
                                        <service.icon className="h-6 w-6 text-phause-cyan" />
                                    </div>

                                    <h3 className="text-xl font-bold leading-snug text-white">
                                        {service.title}
                                    </h3>

                                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">
                                        {service.description}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedService(service)}
                                        className="group/link mt-6 inline-flex items-center gap-3 font-semibold text-phause-cyan transition hover:text-phause-teal"
                                    >
                                        View Details
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-phause-cyan/20 bg-phause-cyan/[0.07] transition group-hover/link:translate-x-1 group-hover/link:bg-phause-cyan/15">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </span>
                                    </button>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. HOW WE WORK */}
            <section id="how-we-work" className="relative overflow-hidden py-20 md:py-28">
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-phause-cyan/[0.05] blur-[130px]" />

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="mx-auto mb-16 max-w-3xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-phause-cyan/20 bg-phause-cyan/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-phause-cyan">
                            <Workflow className="h-4 w-4" />
                            How We Work
                        </span>

                        <h2 className="mt-6 text-3xl font-extrabold sm:text-4xl md:text-5xl">
                            A clear path from{" "}
                            <span className="text-gradient">
                                conversation to action.
                            </span>
                        </h2>

                        <p className="mt-5 text-slate-400">
                            A straightforward framework to help you identify
                            requirements and explore the right next steps.
                        </p>
                    </div>

                    <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-transparent via-phause-cyan/40 to-transparent lg:block" />

                        {renderedProcessSteps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="relative text-center"
                            >
                                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-phause-cyan/30 bg-[#101F2E] shadow-[0_0_30px_rgba(0,216,201,0.08)]">
                                    <step.icon className="h-7 w-7 text-phause-cyan" />
                                </div>

                                <span className="mt-5 block text-xs font-bold tracking-[0.2em] text-phause-cyan">
                                    STEP {step.number}
                                </span>

                                <h3 className="mt-3 text-xl font-bold text-white">
                                    {step.title}
                                </h3>

                                <p className="mx-auto mt-3 max-w-xs text-sm leading-7 text-slate-400">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. WHO WE SERVE */}
            <section id="who-we-serve" className="bg-[#0B1927] py-20 md:py-28">
                <div className="mx-auto grid max-w-7xl items-start gap-14 px-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center gap-2 rounded-full border border-phause-cyan/20 bg-phause-cyan/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-phause-cyan">
                            <Users className="h-4 w-4" />
                            Who We Serve
                        </span>

                        <h2 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">
                            Built for the teams{" "}
                            <span className="text-gradient">
                                protecting their organisation.
                            </span>
                        </h2>

                        <p className="mt-6 leading-8 text-slate-400">
                            Different teams face different challenges.
                            Explore an approach that considers your
                            organisation&apos;s people, processes and priorities.
                        </p>

                        <Link
                            href="/contact"
                            className="mt-8 inline-flex items-center gap-3 font-bold text-phause-cyan transition hover:gap-5"
                        >
                            Find the right service
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </motion.div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {renderedAudiences.map((audience, index) => (
                            <motion.div
                                key={audience.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.07 }}
                                className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:border-phause-cyan/25 hover:bg-phause-cyan/[0.035]"
                            >
                                <audience.icon className="mb-5 h-7 w-7 text-phause-cyan" />
                                <h3 className="font-bold text-white">
                                    {audience.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    {audience.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. WHY CHOOSE PHAUSE */}
            <section id="why-choose" className="relative py-20 md:py-28">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-phause-teal/[0.06] blur-[120px]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6">
                    <div className="mx-auto mb-14 max-w-3xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-phause-cyan/20 bg-phause-cyan/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-phause-cyan">
                            <ShieldCheck className="h-4 w-4" />
                            Why Choose Phause
                        </span>

                        <h2 className="mt-6 text-3xl font-extrabold sm:text-4xl md:text-5xl">
                            Security with a{" "}
                            <span className="text-gradient">
                                practical perspective.
                            </span>
                        </h2>

                        <p className="mt-5 leading-7 text-slate-400">
                            A people-aware and structured approach to
                            understanding phishing-related security needs.
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {renderedBenefits.map((benefit, index) => (
                            <motion.article
                                key={benefit.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.07 }}
                                className="group rounded-2xl border border-white/[0.08] bg-[#101F2E] p-7 transition hover:-translate-y-1 hover:border-phause-cyan/25"
                            >
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-phause-cyan/15 bg-phause-cyan/10 transition group-hover:bg-phause-cyan/15">
                                    <benefit.icon className="h-6 w-6 text-phause-cyan" />
                                </div>

                                <h3 className="text-lg font-bold text-white">
                                    {benefit.title}
                                </h3>

                                <p className="mt-3 text-sm leading-7 text-slate-400">
                                    {benefit.description}
                                </p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. FAQ */}
            <section id="services-faq" className="bg-[#0B1927] py-20 md:py-28">
                <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-phause-cyan/20 bg-phause-cyan/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-phause-cyan">
                            <Headphones className="h-4 w-4" />
                            FAQ
                        </span>

                        <h2 className="mt-6 text-3xl font-extrabold sm:text-4xl">
                            Questions about{" "}
                            <span className="text-gradient">
                                our services.
                            </span>
                        </h2>

                        <p className="mt-5 leading-7 text-slate-400">
                            Need more information? Explore some common
                            questions or speak with our team.
                        </p>

                        <Link
                            href="/contact"
                            className="mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal px-6 py-3.5 font-bold text-phause-dark transition hover:-translate-y-0.5"
                        >
                            Contact Us
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {renderedFaqs.map((faq, index) => {
                            const isOpen = activeFaq === index

                            return (
                                <div
                                    key={faq.question}
                                    className={`overflow-hidden rounded-2xl border transition ${
                                        isOpen
                                            ? "border-phause-cyan/30 bg-phause-cyan/[0.035]"
                                            : "border-white/[0.08] bg-white/[0.025]"
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveFaq(isOpen ? null : index)
                                        }
                                        aria-expanded={isOpen}
                                        className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left"
                                    >
                                        <span className="font-semibold text-white">
                                            {faq.question}
                                        </span>

                                        <ChevronDown
                                            className={`h-5 w-5 flex-shrink-0 text-phause-cyan transition-transform ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: reduceMotion ? 0 : 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="px-6 pb-6 text-sm leading-7 text-slate-400">
                                                    {faq.answer}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* 7. FINAL CTA */}
            <section className="relative overflow-hidden py-20 md:py-28">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-phause-cyan/[0.08] blur-[140px]" />
                </div>

                <div className="relative mx-auto max-w-6xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative overflow-hidden rounded-[2rem] border border-phause-cyan/20 bg-gradient-to-br from-[#102535] to-[#0B1927] px-7 py-14 text-center sm:px-12 md:py-20"
                    >
                        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-phause-cyan to-transparent" />

                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-phause-cyan/20 bg-phause-cyan/10">
                            <ShieldCheck className="h-8 w-8 text-phause-cyan" />
                        </div>

                        <h2 className="mx-auto mt-7 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">
                            Ready to strengthen your{" "}
                            <span className="text-gradient">
                                phishing security approach?
                            </span>
                        </h2>

                        <p className="mx-auto mt-6 max-w-2xl leading-8 text-slate-400">
                            Tell us about your organisation&apos;s requirements.
                            Let&apos;s explore the right services and next steps
                            for your team.
                        </p>

                        <div className="mt-9 flex flex-wrap justify-center gap-4">
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal px-8 py-4 font-bold text-phause-dark shadow-[0_8px_30px_rgba(0,216,201,0.15)] transition hover:-translate-y-1"
                            >
                                Talk to Our Team
                                <ArrowRight className="h-5 w-5" />
                            </Link>

                            <a
                                href="#services"
                                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-8 py-4 font-semibold text-white transition hover:border-phause-cyan/30"
                            >
                                Review Services
                                <ArrowUpRight className="h-5 w-5 text-phause-cyan" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* SERVICE DETAIL MODAL */}
            <ServiceModal
                service={selectedService}
                onClose={() => setSelectedService(null)}
            />
        </main>
    )
}
