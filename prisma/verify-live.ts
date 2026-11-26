/**
 * Live-render verifier for phause-content.json.  Save as prisma/verify-live.ts.  Read-only.
 * Needs the dev/prod server running against the DB you want to check:
 *   BASE_URL=http://localhost:3000 npx tsx prisma/verify-live.ts
 *
 * It fetches each route and checks that every copy string in the JSON is in the rendered
 * HTML (scripts stripped, so text only found inside Next's JS payload does NOT count),
 * plus <meta> descriptions, form placeholders, nav, footer, docs and posts, and that old /
 * unverified text is absent. Exit code 1 on any failure.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const pack: any = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "phause-content.json"), "utf8"));

const decode = (s: string) =>
    s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
        .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-");
const squash = (s: string) => decode(s).replace(/\s+/g, " ").trim().toLowerCase();
const stripScripts = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
const toText = (h: string) => squash(stripScripts(h).replace(/<[^>]+>/g, " "));
const toRaw = (h: string) => squash(stripScripts(h)); // keeps attributes (placeholder, meta content)

// Keys that are not visible copy
const SKIP = /^(type|variant|slug|route|status|new|key|id|icon|image|order|category|number|formSlug|suggestedKey|required|note|readingTime|featuredImage.*|seo|.*(Link|Href|href|link)|imageAlt|imageSuggestion|primaryKeywordTheme|secondaryThemes|pageGoal|_.*|omit)$/;
function strings(node: any, out: string[] = []): string[] {
    if (typeof node === "string") { if (node.trim().length >= 3) out.push(node.trim()); }
    else if (Array.isArray(node)) node.forEach((n) => strings(n, out));
    else if (node && typeof node === "object")
        for (const [k, v] of Object.entries(node)) if (!SKIP.test(k)) strings(v, out);
    return out;
}
const htmlParas = (h: string) =>
    h.split(/<\/(?:p|h\d|li)>/).map((x) => x.replace(/<[^>]+>/g, "").trim())
        .filter((x) => x.length > 15 && !/WEBSITE CONTENT LIBRARY/.test(x));

// Old / unverified text that must not appear
const OLD: [string, RegExp][] = [
    ["Install the Phause Agent", /install the phause agent/i], ["Kubernetes", /kubernetes/i], ["SIEM", /\bSIEM\b/],
    ["CI/CD", /CI\/CD/], ["Sentinel", /sentinel/i], ["14-day", /14[- ]day/i], ["HIPAA", /HIPAA/],
    ["SOC 2", /SOC ?2/], ["ISO 27001", /ISO ?27001/], ["24/7", /24\/7/],
    ["fake phone", /\(555\)|555\) ?010/], ["San Francisco", /san francisco/i],
    ["[placeholder]", /\[(legal entity|insert|describe|name|purpose)[^\]]*\]/i],
    ["PDF footer leak", /WEBSITE CONTENT LIBRARY/],
];

const results: any[] = [];
let fails = 0;
const cache = new Map<string, { status: number; text: string; raw: string; plain: string }>();
async function get(route: string) {
    if (!cache.has(route)) {
        const r = await fetch(BASE + route, { redirect: "follow" });
        const h = await r.text();
        cache.set(route, { status: r.status, text: toText(h), raw: toRaw(h), plain: decode(stripScripts(h).replace(/<[^>]+>/g, " ")) });
    }
    return cache.get(route)!;
}
async function check(label: string, route: string, texts: string[], opts: { raw?: string[]; skipOld?: boolean } = {}) {
    const { status, text, raw } = await get(route);
    const need = [...new Set(texts)];
    const miss = need.filter((t) => !text.includes(squash(t)));
    const missRaw = [...new Set(opts.raw ?? [])].filter((t) => !raw.includes(squash(t)));
    let old: string[] = [];
    if (!opts.skipOld) {
        const plain = cache.get(route)!.plain; // original case, tags removed
        old = OLD.filter(([, re]) => re.test(plain)).map(([n]) => n);
        if (route !== "/faq" && /\bSOC\b/.test(plain)) old.push("SOC"); // FAQ #3 names it in the negative
    }
    const bad = status !== 200 || miss.length || missRaw.length || old.length;
    if (bad) fails++;
    results.push({ check: label, route, status, found: `${need.length - miss.length + (opts.raw?.length ?? 0) - missRaw.length}/${need.length + (opts.raw?.length ?? 0)}`, oldText: old.join(", ") || "-", ok: bad ? "FAIL" : "ok" });
    [...miss, ...missRaw].slice(0, 12).forEach((m) => console.log(`  MISSING on ${route} [${label}]: ${m.slice(0, 100)}`));
}

(async () => {
    const P = pack.pages;
    const ROUTE: Record<string, string> = {
        home: "/", services: "/services", "how-it-works": "/how-it-works", solutions: "/solutions",
        about: "/about", subscription: "/subscription", contact: "/contact", "security-policy": "/security-policy",
    };

    // 1) Page blocks (visible text)
    for (const [slug, route] of Object.entries(ROUTE)) {
        const page = P[slug];
        let texts = strings(page.blocks);
        if (slug === "contact") texts = texts.filter((t) => t !== "contact-form");
        await check(`page:${slug}`, route, texts);
    }

    // 2) Draft page must not be public
    const res = await get("/resources");
    const resOk = res.status === 404;
    if (!resOk) fails++;
    results.push({ check: "resources (DRAFT)", route: "/resources", status: res.status, found: resOk ? "404 ok" : "SHOULD BE 404", oldText: "-", ok: resOk ? "ok" : "FAIL" });

    // 3) SEO: <title>/meta description for every route (legal pages: SEO only)
    for (const s of pack.seo) {
        if (s.route === "/resources") continue;
        await check(`seo:${s.slug}`, s.route, [], { raw: [s.description], skipOld: true });
        const { raw } = await get(s.route);
        const titleOk = raw.includes(squash(s.title));
        if (!titleOk) { fails++; console.log(`  SEO TITLE not found on ${s.route}: ${s.title}`); }
    }

    // 4) FAQ page: 24 Q&As
    await check("faq (24)", "/faq", pack.faqs.flatMap((f: any) => [f.question, f.answer]));
    // 5) Home FAQ preview is covered by page:home; services FAQ by page:services

    // 6) Posts: title, every heading/paragraph/bullet; listed on /blog
    const blogTitles = pack.posts.map((p: any) => p.title);
    await check("blog index", "/blog", blogTitles);
    for (const p of pack.posts) await check(`post:${p.slug}`, `/blog/${p.slug}`, [p.title, ...htmlParas(p.contentHtml)], { raw: [p.metaDescription] });

    // 7) Contact form: labels, options, intro, privacy note, button (text) + placeholder (attribute)
    const f = pack.forms.contact;
    await check("contact form", "/contact",
        [f.title, f.intro, f.submitButton, f.privacyNote, ...f.fields.map((x: any) => x.label), ...f.fields.flatMap((x: any) => x.options ?? [])],
        { raw: [f.messagePlaceholder] });

    // 8) Docs: hero, categories, quick-start, closing note, search placeholder
    const d = pack.docs;
    const qs = d.quickStart;
    await check("docs", "/docs",
        [d.hero.eyebrow, d.hero.title, d.hero.description, ...d.navigation.map((n: any) => n.category),
        qs.title, ...qs.sections.flatMap((s: any) => [s.heading, ...s.steps]), d.closingNote],
        { raw: [d.hero.searchPlaceholder] });

    // 9) Navigation + footer (checked on "/" and on a nested page to catch relative-href bugs)
    const nav = pack.navigation.header;
    await check("nav labels", "/", nav.map((n: any) => n.label));
    for (const r of ["/", "/blog/" + pack.posts[0].slug]) {
        const { raw } = await get(r);
        const badHrefs = nav.filter((n: any) => !raw.includes(`href="${n.href}"`)).map((n: any) => n.href);
        if (badHrefs.length) { fails++; console.log(`  NAV hrefs not found on ${r}: ${badHrefs.join(", ")}`); }
        results.push({ check: "nav hrefs", route: r, status: 200, found: `${nav.length - badHrefs.length}/${nav.length}`, oldText: "-", ok: badHrefs.length ? "FAIL" : "ok" });
    }
    await check("footer description", "/", [pack.global.footerDescription], { skipOld: false });

    console.table(results);
    console.log(fails
        ? `\n${fails} check(s) FAILED. Fix the seed/renderer, not this script.`
        : "\nAll content-pack text renders on its live route and no old text was found.");
    console.log("\nNOT covered (check by hand): contact success/error messages (appear only after a real submit),\n"
        + "lead appears in the CMS, DRAFT docs articles stay unpublished, images/layout, /subscription live plan cards.");
    process.exit(fails ? 1 : 0);
})();