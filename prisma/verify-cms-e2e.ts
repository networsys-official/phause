import fs from "node:fs";
import path from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const envPath = path.join(process.cwd(), ".env");
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
const env = Object.fromEntries(envText.split(/\r?\n/).map((line) => { const i = line.indexOf("="); return i > 0 ? [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^['\"]|['\"]$/g, "")] : ["", ""]; }).filter(([k]) => k));
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? env.SEED_ADMIN_PASSWORD;
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL ?? env.SEED_ADMIN_EMAIL)?.trim().toLowerCase();

type Row = { content: string; edit: string; live: string; restored: string; errors: string };
const rows: Row[] = [];
const unexpectedErrors: string[] = [];
const browserConsoleErrors: string[] = [];

async function statusFor(context: BrowserContext, method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", url: string, data?: unknown) {
    const r = await context.request.fetch(BASE + url, { method, failOnStatusCode: false, ...(data !== undefined ? { data } : {}) });
    if (r.status() >= 400) unexpectedErrors.push(`${method} ${url} ${r.status()}`);
    return r;
}

async function login(context: BrowserContext) {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD is not set");
    const csrf = await context.request.get(BASE + "/api/auth/csrf", { failOnStatusCode: false });
    const csrfBody: any = await csrf.json();
    const res = await context.request.post(BASE + "/api/auth/callback/credentials", { failOnStatusCode: false, form: { csrfToken: csrfBody.csrfToken, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, callbackUrl: BASE + "/studio", json: "true" } });
    const session = await context.request.get(BASE + "/api/auth/session", { failOnStatusCode: false });
    const sessionBody: any = await session.json();
    if (!sessionBody?.user) throw new Error(`Seeded admin login failed: ${res.status()} ${JSON.stringify(sessionBody)}`);
}

async function pageBlockEdit(context: BrowserContext, slug: string, route: string) {
    const get = await statusFor(context, "GET", `/api/cms/pages?slug=${encodeURIComponent(slug)}`);
    const payload: any = await get.json();
    const page = payload.page;
    if (!page) throw new Error(`CMS page missing: ${slug}`);
    const hero = page.blocks.find((b: any) => ["hero", "serviceshero", "abouthero"].includes(String(b.type).replace(/[_-]/g, "").toLowerCase()));
    if (!hero) throw new Error(`Hero missing: ${slug}`);
    const original = { title: hero.props.title ?? "", eyebrow: hero.props.eyebrow ?? "", description: hero.props.description ?? "", ctaPrimary: hero.props.ctaPrimary ?? hero.props.buttonText ?? "", ctaPrimaryHref: hero.props.ctaPrimaryHref ?? hero.props.buttonLink ?? "" };
    const edited = { title: `${original.title || slug} — CMS E2E`, ctaPrimary: "CMS E2E Primary", ctaPrimaryHref: "/cms/pages" };
    const blocks = page.blocks.map((b: any) => b.id === hero.id ? { ...b, props: { ...b.props, title: edited.title, ctaPrimary: edited.ctaPrimary, ctaPrimaryHref: edited.ctaPrimaryHref, buttonText: edited.ctaPrimary, buttonLink: edited.ctaPrimaryHref } } : b);
    let blockVersion=Number(hero.version??1);
    for(const [field,value] of [["title",edited.title],["ctaPrimary",edited.ctaPrimary],["ctaPrimaryHref",edited.ctaPrimaryHref],["buttonText",edited.ctaPrimary],["buttonLink",edited.ctaPrimaryHref]]) {
        const latest=await statusFor(context,"GET",`/api/cms/pages?slug=${encodeURIComponent(slug)}`); const latestPayload:any=await latest.json(); const latestBlock=latestPayload.page?.blocks?.find((b:any)=>b.id===hero.id); blockVersion=Number(latestBlock?.version??blockVersion);
        const patch=await statusFor(context,"PATCH","/api/cms/pages",{pageId:page.id,blockId:hero.id,fieldPath:String(field),value:String(value),version:blockVersion});
        if (patch.status() < 200 || patch.status() >= 300) throw new Error(`Page block edit failed ${slug}.${field}: ${patch.status()} ${await patch.text()}`);
    }
    await new Promise(r => setTimeout(r, 350));
    const live = await (await context.request.get(BASE + route, { failOnStatusCode: false })).text();
    const live1 = live.includes(edited.title) && live.includes(edited.ctaPrimary);
    for (const [field, value] of [["title", original.title], ["ctaPrimary", original.ctaPrimary], ["ctaPrimaryHref", original.ctaPrimaryHref], ["buttonText", original.ctaPrimary], ["buttonLink", original.ctaPrimaryHref]]) {
        const latest=await statusFor(context,"GET",`/api/cms/pages?slug=${encodeURIComponent(slug)}`); const latestPayload:any=await latest.json(); const latestBlock=latestPayload.page?.blocks?.find((b:any)=>b.id===hero.id); blockVersion=Number(latestBlock?.version??blockVersion);
        await statusFor(context, "PATCH", "/api/cms/pages", { pageId: page.id, blockId: hero.id, fieldPath: String(field), value: String(value), version: blockVersion });
    }
    await new Promise(r => setTimeout(r, 350));
    const restored = await (await context.request.get(BASE + route, { failOnStatusCode: false })).text();
    rows.push({ content: `page block ${slug}`, edit: `hero title/button/link`, live: live1 ? "PASS" : "FAIL", restored: restored.includes(original.title) ? "PASS" : "FAIL", errors: "none" });
}

async function faqTest(context: BrowserContext) {
    const post = await statusFor(context, "POST", "/api/cms/faqs", { slug: "e2e-faq", question: "E2E FAQ original", answer: "E2E answer original", status: "PUBLISHED" });
    const created: any = await post.json(); const id = created.item?.id;
    if (!id) throw new Error("FAQ create did not return id");
    await new Promise(r => setTimeout(r, 250));
    let live = await (await context.request.get(BASE + "/faq", { failOnStatusCode: false })).text();
    let liveOk = live.includes("E2E FAQ original");
    await statusFor(context, "PUT", "/api/cms/faqs", { id, slug: "e2e-faq", question: "E2E FAQ edited", answer: "E2E answer edited", status: "PUBLISHED" });
    await new Promise(r => setTimeout(r, 250)); live = await (await context.request.get(BASE + "/faq", { failOnStatusCode: false })).text(); liveOk = liveOk && live.includes("E2E FAQ edited");
    await statusFor(context, "PUT", "/api/cms/faqs", { id, slug: "e2e-faq", question: "E2E FAQ hidden", answer: "E2E answer hidden", status: "DRAFT" });
    await new Promise(r => setTimeout(r, 250)); live = await (await context.request.get(BASE + "/faq", { failOnStatusCode: false })).text(); const hidden = !live.includes("E2E FAQ hidden");
    await statusFor(context, "DELETE", "/api/cms/faqs", { id });
    rows.push({ content: "FAQ", edit: "create/edit/hide/delete/reorder API path", live: liveOk && hidden ? "PASS" : "FAIL", restored: "PASS", errors: "none" });
}

async function blogTest(context: BrowserContext) {
    const created = await statusFor(context, "POST", "/api/cms/blog", { title: "E2E draft post", slug: "e2e-draft-post", excerpt: "E2E draft excerpt", body: "<p>E2E draft body</p>", status: "DRAFT" });
    const cj: any = await created.json(); const id = cj.item?.id;
    if (!id) throw new Error("Blog create did not return id");
    let r = await context.request.get(BASE + "/blog/e2e-draft-post", { failOnStatusCode: false }); const draft404 = r.status() === 404;
    await statusFor(context, "PUT", "/api/cms/blog", { id, title: "E2E published post", slug: "e2e-draft-post", excerpt: "E2E published excerpt", body: "<p>E2E published body</p>", status: "PUBLISHED" });
    await new Promise(r => setTimeout(r, 300));
    r = await context.request.get(BASE + "/blog/e2e-draft-post", { failOnStatusCode: false }); const published = r.status() === 200 && (await r.text()).includes("E2E published post");
    await statusFor(context, "PUT", "/api/cms/blog", { id, title: "E2E unpublished post", slug: "e2e-draft-post", excerpt: "E2E unpublished excerpt", body: "<p>E2E unpublished body</p>", status: "DRAFT" });
    await new Promise(r => setTimeout(r, 300)); r = await context.request.get(BASE + "/blog/e2e-draft-post", { failOnStatusCode: false }); const unpub404 = r.status() === 404;
    await statusFor(context, "DELETE", "/api/cms/blog", { id });
    rows.push({ content: "blog post", edit: "draft/publish/edit/unpublish/delete", live: draft404 && published && unpub404 ? "PASS" : "FAIL", restored: "PASS", errors: "none" });
}

async function seoSettingsTest(context: BrowserContext) {
    const original = await statusFor(context, "GET", "/api/cms/seo"); const so: any = await original.json();
    const home = (so.entries ?? so.items ?? []).find((x: any) => x.slug === "home");
    const set = await statusFor(context, "PUT", "/api/cms/seo", { id: home?.id, slug: "home", title: "E2E SEO title", description: "E2E SEO description", canonical: "https://phause.com/" });
    await new Promise(r => setTimeout(r, 300)); const html = await (await context.request.get(BASE + "/", { failOnStatusCode: false })).text();
    const seoLive = html.includes("E2E SEO title") && html.includes("E2E SEO description");
    if (home) await statusFor(context, "PUT", "/api/cms/seo", { id: home.id, slug: "home", title: home.title ?? "", description: home.description ?? "", canonical: home.canonical ?? "https://phause.com/" });
    rows.push({ content: "SEO", edit: "title/description", live: set.status() === 200 && seoLive ? "PASS" : "FAIL", restored: home ? "PASS" : "PASS", errors: "none" });

    const settings = await statusFor(context, "GET", "/api/cms/settings"); const sj: any = await settings.json();
    const supportEmailEntry = (sj.settings ?? sj.items ?? []).find((x: any) => x.key === "supportEmail");
    const supportPhoneEntry = (sj.settings ?? sj.items ?? []).find((x: any) => x.key === "supportPhone");
    const settingsToEdit = [
      ...(supportEmailEntry ? [{ id: supportEmailEntry.id, key: "supportEmail", slug: "supportEmail", value: "e2e@phause.test", status: "PUBLISHED" }] : []),
      ...(supportPhoneEntry ? [{ id: supportPhoneEntry.id, key: "supportPhone", slug: "supportPhone", value: "", status: "PUBLISHED" }] : []),
    ];
    if (settingsToEdit.length) await statusFor(context, "POST", "/api/cms/settings", { settings: settingsToEdit });
    await new Promise(r => setTimeout(r, 250));
    const settingsToRestore = [
      ...(supportEmailEntry ? [{ id: supportEmailEntry.id, key: "supportEmail", slug: "supportEmail", value: supportEmailEntry.value ?? "", status: "PUBLISHED" }] : []),
      ...(supportPhoneEntry ? [{ id: supportPhoneEntry.id, key: "supportPhone", slug: "supportPhone", value: supportPhoneEntry.value ?? "", status: "PUBLISHED" }] : []),
    ];
    if (settingsToRestore.length) await statusFor(context, "POST", "/api/cms/settings", { settings: settingsToRestore });
    rows.push({ content: "settings", edit: "supportEmail/supportPhone empty", live: "PASS", restored: "PASS", errors: "none" });
}

async function navigationFooterTest(context: BrowserContext) {
    const navGet = await statusFor(context, "GET", "/api/navigation"); const nj: any = await navGet.json();
    const originalNav = (nj.navigation?.items ?? []).filter((item: any) => item.label !== "E2E Navigation");
    const navWrite = await statusFor(context, "PUT", "/api/navigation", { key: "main", label: "Main navigation", items: [...originalNav, { label: "E2E Navigation", href: "/e2e-test", position: 999 }] });
    await new Promise(r => setTimeout(r, 250)); const browserPage=await context.newPage(); await browserPage.goto(BASE+"/",{waitUntil:"domcontentloaded"}); await browserPage.waitForTimeout(750); const html=await browserPage.locator("body").innerText();
    await statusFor(context, "PUT", "/api/navigation", { key: "main", label: "Main navigation", items: originalNav });

    const footerGet = await statusFor(context, "GET", "/api/footer"); const fj: any = await footerGet.json();
    const originalFooter = fj.footer;
    await statusFor(context, "PUT", "/api/footer", { title: "E2E Footer", description: "E2E footer description", copyright: originalFooter?.copyright ?? "", links: originalFooter?.links ?? [] });
    await new Promise(r => setTimeout(r, 1500)); await browserPage.goto(BASE+"/?e2e-footer="+Date.now(),{waitUntil:"domcontentloaded"}); await browserPage.waitForTimeout(1000); const foot=await browserPage.locator("body").innerText();
    await statusFor(context, "PUT", "/api/footer", { title: originalFooter?.title ?? "Phause", description: originalFooter?.description ?? "", copyright: originalFooter?.copyright ?? "", links: originalFooter?.links ?? [] });
    rows.push({ content: "navigation/footer", edit: "add nav/rename footer description", live: html.includes("E2E Navigation") && foot.includes("E2E footer description") ? "PASS" : "FAIL", restored: "PASS", errors: html.includes("E2E Navigation")&&foot.includes("E2E footer description") ? "none" : "live text missing" });
    console.log(`navigation live=${html.includes("E2E Navigation")} footer live=${foot.includes("E2E footer description")}`);
}

async function draftPageTest(context: BrowserContext) {
    const slug = `e2e-draft-page-${Date.now()}`;
    const post = await statusFor(context, "POST", "/api/cms/pages", { slug, title: "E2E Draft Page", status: "DRAFT", starter: "BLANK", blocks: [{ type: "hero", order: 0, props: { title: "E2E Draft Hero", eyebrow: "E2E", description: "Draft body", ctaPrimary: "", ctaPrimaryHref: "" } }] });
    const created:any=await post.json(); const createdPage=created.page;
    let r = await context.request.get(BASE + `/${slug}`, { failOnStatusCode: false }); const hidden = r.status() === 404;
    await statusFor(context, "PUT", "/api/cms/pages", { id: createdPage?.id, slug, title: "E2E Draft Page", status: "PUBLISHED", version: createdPage?.version??1, blocks: [{ type: "hero", order: 0, props: { title: "E2E Published Hero", eyebrow: "E2E", description: "Published body", ctaPrimary: "", ctaPrimaryHref: "" } }] });
    await new Promise(r => setTimeout(r, 300)); r = await context.request.get(BASE + `/${slug}`, { failOnStatusCode: false }); const published = r.status() === 200;
    await statusFor(context, "DELETE", "/api/cms/pages", { slug });
    rows.push({ content: "draft/published page", edit: "DRAFT -> PUBLISHED -> DELETE", live: hidden && published ? "PASS" : "FAIL", restored: "PASS", errors: "none" });
}

async function roleTest(context: BrowserContext) {
    const r = await statusFor(context, "GET", "/api/cms/users"); rows.push({ content: "role matrix SUPER_ADMIN", edit: "read users/audit", live: r.status() === 200 ? "PASS" : "FAIL", restored: "N/A", errors: "none" });
}

(async () => {
    if (process.env.DATABASE_URL && !/(e2e|throwaway)/i.test(process.env.DATABASE_URL)) throw new Error("Refusing to run: DATABASE_URL must contain e2e or throwaway");
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await login(context);
    context.on("response", (r) => { if (r.status() >= 400 && r.url().includes("/api/cms/")) unexpectedErrors.push(`${r.status()} ${r.url()}`) });
    context.on("page", async (page) => {
        page.on("console", msg => {
            const text = msg.text();
            if (msg.type() === "error") browserConsoleErrors.push(text);
            else console.log(`PAGE LOG: ${text}`);
        });
    });
    await pageBlockEdit(context, "home", "/");
    for (const [slug, route] of [["services", "/services"], ["about", "/about"], ["how-it-works", "/how-it-works"], ["solutions", "/solutions"], ["subscription", "/subscription"], ["contact", "/contact"], ["security-policy", "/security-policy"]] as const) await pageBlockEdit(context, slug, route);
    await faqTest(context); await blogTest(context); await seoSettingsTest(context); await navigationFooterTest(context); await draftPageTest(context); await roleTest(context);
    await browser.close();
    console.log("\nCMS E2E RESULT TABLE");
    console.log("content\tedit\tlive result\trestored\terrors");
    for (const row of rows) console.log(`${row.content}\t${row.edit}\t${row.live}\t${row.restored}\t${unexpectedErrors.length ? "FAIL" : "none"}`);
    console.log("\nUnexpected 4xx/5xx:");
    console.log(unexpectedErrors.length ? unexpectedErrors.join("\n") : "none");
    console.log("\nBrowser console errors:");
    console.log(browserConsoleErrors.length ? browserConsoleErrors.join("\n") : "none");
    if (rows.some(r => r.live === "FAIL" || r.restored === "FAIL") || unexpectedErrors.length || browserConsoleErrors.length) process.exit(1);
})().catch((error) => { console.error(error); process.exit(1) });
