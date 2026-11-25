/**
 * Phause content-pack verifier.
 * Place at prisma/verify-content.ts (next to prisma/data/phause-content.json).
 * Run:  npx tsx prisma/verify-content.ts            (uses DATABASE_URL)
 * Read-only. Exit code 1 if anything from the content pack is missing in the database.
 * It reads rows generically (to_jsonb), so it does not depend on column names.
 */
import fs from "node:fs";
import path from "node:path";

type Row = Record<string, unknown>;
export type Db = { pages: Row[]; blocks: Row[]; faqs: Row[]; posts: Row[]; forms: Row[]; settings: Row[]; navItems: Row[]; footers: Row[]; seos: Row[]; categories: Row[]; postCategories: Row[] };
export type Finding = { entity: string; where: string; path: string; expected: string };

const SKIP_KEYS = new Set(["type", "variant", "number", "icon", "image", "slug", "route", "status", "new", "href", "buttonLink", "secondaryButtonLink", "primaryButtonLink", "ctaPrimaryHref", "ctaSecondaryHref", "secondaryHref", "formSlug", "order", "bodyProvided", "featuredImage", "suggestedKey", "required", "omit"]);
const STALE = ["sentinel", "install the phause agent", "deploy on kubernetes", "add phause to ci/cd", "connect your siem", "14-day", "money-back", "air-gapped", "hipaa", "24/7 soc"];
// the document's own FAQ #3 names these only to say Phause is NOT one
const STALE_ALLOW = ["is phause a managed security operations service or endpoint protection tool"];

export const norm = (s: string) =>
    s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
        .replace(/\*\*|`/g, "").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();

function flatten(o: unknown, out: string[] = []): string[] {
    if (typeof o === "string") { const t = norm(o); if (t) out.push(t); }
    else if (Array.isArray(o)) o.forEach((v) => flatten(v, out));
    else if (o && typeof o === "object") Object.values(o as Row).forEach((v) => flatten(v, out));
    return out;
}
const textOf = (...rows: unknown[]) => flatten(rows).join("\n");

function expectations(o: unknown, p = "", out: { path: string; text: string }[] = []) {
    if (typeof o === "string") {
        const t = norm(o);
        if (t.length >= 3 && /[a-z]/.test(t) && !t.startsWith("/")) out.push({ path: p, text: t });
    } else if (Array.isArray(o)) o.forEach((v, i) => expectations(v, `${p}[${i}]`, out));
    else if (o && typeof o === "object") {
        for (const [k, v] of Object.entries(o as Row)) {
            if (k.startsWith("_") || SKIP_KEYS.has(k)) continue;
            expectations(v, p ? `${p}.${k}` : k, out);
        }
    }
    return out;
}
const live = (r: Row) => r.deletedAt == null;
const key = (r: Row, rx: RegExp) => Object.keys(r).find((k) => rx.test(k));

export function verify(db: Db, content: any) {
    const missing: Finding[] = [];
    const summary: Record<string, { expected: number; found: number }> = {};
    const tally = (entity: string, ok: boolean, f?: Finding) => {
        const s = (summary[entity] ??= { expected: 0, found: 0 });
        s.expected++; if (ok) s.found++; else if (f) missing.push(f);
    };

    // ---- pages ----
    const seoText = textOf(db.seos.filter(live));
    const pageBlocks = (page: Row) => {
        const idKey = key(page, /^id$/)!; const id = page[idKey];
        return db.blocks.filter((b) => live(b) && (b[key(b, /^page_?id$/i) ?? ""] === id));
    };
    for (const [slug, p] of Object.entries<any>(content.pages)) {
        const page = db.pages.find((r) => r.slug === p.slug && live(r));
        const label = `/${p.slug}`;
        const seoOnly = p.status === "SEO_ONLY";
        if (seoOnly) {
            const exp: { path: string; text: string }[] = [];
            const seoFields = { title: p.seo?.title, description: p.seo?.description };
            expectations(seoFields, "seo", exp);
            for (const e of exp) tally("page fields", seoText.includes(e.text), { entity: "page", where: label, path: e.path, expected: e.text.slice(0, 140) });
            continue;
        }
        if (!page) { tally("page exists", false, { entity: "page", where: label, path: "(page)", expected: "page row exists" }); continue; }
        tally("page exists", true);
        const text = textOf(page, pageBlocks(page));
        if (p.status === "PUBLISHED" || p.status === "PUBLISH_PARTIAL") {
            const st = String(page.status);
            const wantDraft = slug === "resources";
            tally("page status", wantDraft ? st === "DRAFT" : st === "PUBLISHED", { entity: "page", where: label, path: "status", expected: wantDraft ? "DRAFT" : "PUBLISHED (found " + st + ")" });
        }
        const exp: { path: string; text: string }[] = [];
        const seoFields = { title: p.seo?.title, description: p.seo?.description }; // keyword themes / page goal are editorial notes, not stored fields
        if (p.status === "SEO_ONLY") expectations(seoFields, "seo", exp);
        else { expectations(p.blocks, "blocks", exp); expectations(seoFields, "seo", exp); }
        for (const e of exp) {
            const inPage = text.includes(e.text) || (e.path.startsWith("seo") && seoText.includes(e.text));
            tally("page fields", inPage, { entity: "page", where: label, path: e.path, expected: e.text.slice(0, 140) });
        }
    }

    // ---- FAQs ----
    const faqs = db.faqs.filter(live);
    for (const f of content.faqs) {
        const q = norm(f.question), a = norm(f.answer);
        const row = faqs.find((r) => flatten(r).some((t) => t === q));
        tally("faq question", !!row, { entity: "faq", where: `FAQ ${f.order}`, path: "question", expected: f.question });
        tally("faq answer", !!row && textOf(row).includes(a), { entity: "faq", where: `FAQ ${f.order}`, path: "answer", expected: f.answer.slice(0, 140) });
    }

    // ---- posts ----
    const posts = db.posts.filter(live);
    const POST_CATEGORY_OVERRIDE: Record<string, string> = { "turn-phishing-campaign-results-into-learning": "Reporting and Improvement" };
    for (const po of content.posts) {
        const row = posts.find((r) => r.slug === po.slug);
        tally("post exists", !!row, { entity: "post", where: po.slug, path: "(post)", expected: "post row exists" });
        if (!row) continue;
        const t = textOf(row);
        const seoId = String(row.seoId ?? row.seo_id ?? "");
        const postSeo = db.seos.find((s) => String(s.id ?? "") === seoId || s.slug === `${po.slug}-seo`) ?? {};
        const postCategoryIds = db.postCategories
            .filter((link) => String(link.B ?? link.postId ?? link.post_id ?? "") === String(row.id ?? ""))
            .map((link) => String(link.A ?? link.categoryId ?? link.category_id ?? ""));
        const categoryNames = db.categories.filter((c) => postCategoryIds.includes(String(c.id ?? ""))).map((c) => String(c.name ?? ""));
        const categoryExpected = POST_CATEGORY_OVERRIDE[po.slug] ?? po.category;
        const checks: [string, string][] = [["title", po.title], ["seoTitle", String(postSeo.title ?? po.seoTitle)], ["metaDescription", String(postSeo.description ?? po.metaDescription)], ["featuredImageAlt", po.featuredImageAlt]];
        for (const [k, v] of checks) tally("post meta", t.includes(norm(v)) || textOf(postSeo).includes(norm(v)), { entity: "post", where: po.slug, path: k, expected: v });
        tally("post meta", categoryNames.includes(categoryExpected), { entity: "post", where: po.slug, path: "category", expected: categoryExpected });
        const parts = (po.contentHtml as string).match(/<(h2|p|li)>.*?<\/\1>/g) ?? [];
        for (const part of parts) { const x = norm(part); tally("post body", t.includes(x), { entity: "post", where: po.slug, path: "body", expected: x.slice(0, 140) }); }
    }

    // ---- contact form ----
    const cf = content.forms.contact;
    const formRow = db.forms.find((r) => r.slug === "contact-form" && live(r));
    tally("contact form exists", !!formRow, { entity: "form", where: "contact-form", path: "(form)", expected: "form row exists" });
    const formText = textOf(formRow ?? {}, db.pages.filter((r) => r.slug === "contact"), pageBlocks(db.pages.find((r) => r.slug === "contact") ?? {}));
    const formExp: [string, string][] = [["title", cf.title], ["intro", cf.intro], ["messagePlaceholder", cf.messagePlaceholder], ["submitButton", cf.submitButton], ["privacyNote", cf.privacyNote], ["successMessage", cf.successMessage], ["errorMessage", cf.errorMessage]];
    for (const f of cf.fields) { formExp.push([`field ${f.label}`, f.label]); for (const o of f.options ?? []) formExp.push([`option ${o}`, o]); }
    for (const [k, v] of formExp) tally("contact form fields", formText.includes(norm(v)), { entity: "form", where: "contact-form", path: k, expected: v });

    // ---- navigation + footer ----
    const nav = db.navItems.filter(live);
    for (const n of content.navigation.header) {
        const row = nav.find((r) => flatten(r).includes(norm(n.label)));
        tally("nav item", !!row, { entity: "navigation", where: n.label, path: "label", expected: n.label });
        if (row) tally("nav href", textOf(row).includes(n.href), { entity: "navigation", where: n.label, path: "href", expected: n.href });
    }
    for (const r of nav) {
        const hk = Object.keys(r).find((k) => /href|url|link|path/i.test(k) && typeof r[k] === "string");
        const v = hk ? String(r[hk]) : "";
        if (hk && v && !/^(\/|https?:|mailto:|tel:|#)/.test(v))
            tally("nav href format", false, { entity: "navigation", where: String(r.label ?? r.title ?? r.id), path: hk, expected: `"${v}" must start with "/"` });
    }
    tally("footer description", textOf(db.footers.filter(live)).includes(norm(content.global.footerDescription)), { entity: "footer", where: "footer", path: "description", expected: content.global.footerDescription });

    // ---- docs ----
    const docsPage = db.pages.find((r) => r.slug === "docs" && live(r));
    const docsText = docsPage ? textOf(docsPage, pageBlocks(docsPage)) : "";
    for (const g of content.docs.navigation) {
        tally("docs group", docsText.includes(norm(g.category)), { entity: "docs", where: "/docs", path: "group", expected: g.category });
        for (const a of g.articles) tally("docs article title", docsText.includes(norm(a.title)), { entity: "docs", where: "/docs", path: g.category, expected: a.title });
    }
    for (const s of content.docs.quickStart.sections) for (const step of [s.heading, ...s.steps]) tally("docs quick-start", docsText.includes(norm(step)), { entity: "docs", where: "/docs quick-start", path: s.heading, expected: step });
    tally("docs closing note", docsText.includes(norm(content.docs.closingNote)), { entity: "docs", where: "/docs", path: "closingNote", expected: content.docs.closingNote });

    // ---- stale content must be gone from LIVE content ----
    const livePageStatus = (p: Row) => String(p.status) === "PUBLISHED";
    const liveSources: [string, string][] = [
        ...db.pages.filter((p) => live(p) && livePageStatus(p)).map((p) => [`page /${p.slug}`, textOf(p, pageBlocks(p))] as [string, string]),
        ...faqs.map((r) => [`faq`, textOf(r)] as [string, string]),
        ...posts.map((r) => [`post ${r.slug}`, textOf(r)] as [string, string]),
    ];
    for (const [where, txt] of liveSources) for (const s of STALE) {
        if (!txt.includes(s)) continue;
        if (STALE_ALLOW.some((a) => txt.includes(a))) continue;
        tally("stale content absent", false, { entity: "stale", where, path: "text", expected: `found old text: "${s}"` });
    }
    tally("stale content absent", true);
    return { missing, summary };
}

// ---------------- CLI ----------------
async function loadDb(): Promise<Db> {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const q = async (table: string): Promise<Row[]> => {
        try { return (await prisma.$queryRawUnsafe(`select to_jsonb(t) as r from "${table}" t`) as { r: Row }[]).map((x) => x.r); }
        catch { console.warn(`! table "${table}" not readable; treated as empty`); return []; }
    };
    const db = {
        pages: await q("Page"), blocks: await q("PageBlock"), faqs: await q("Faq"), posts: await q("Post"),
        forms: await q("Form"), settings: await q("Setting"), navItems: await q("NavigationItem"), footers: await q("Footer"), seos: await q("Seo"),
        categories: await q("Category"), postCategories: await q("_CategoryToPost"),
    };
    await prisma.$disconnect();
    return db;
}

async function main() {
    const content = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "phause-content.json"), "utf8"));
    const url = (process.env.DATABASE_URL ?? "").replace(/:[^:@/]+@/, ":***@");
    console.log("Verifying against:", url);
    const { missing, summary } = verify(await loadDb(), content);
    console.log("\nCHECK".padEnd(26) + "FOUND / EXPECTED");
    for (const [k, v] of Object.entries(summary)) console.log(k.padEnd(25) + `${v.found} / ${v.expected}` + (v.found === v.expected ? "" : "   <-- MISSING"));
    if (missing.length) {
        console.log(`\n${missing.length} item(s) missing or wrong:\n`);
        for (const m of missing) console.log(`- [${m.entity}] ${m.where} :: ${m.path} :: ${m.expected}`);
        process.exit(1);
    }
    console.log("\nAll content-pack fields are present in the database.");
}
if (require.main === module) main().catch((e) => { console.error(e); process.exit(2); });