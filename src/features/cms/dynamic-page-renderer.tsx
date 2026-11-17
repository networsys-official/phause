import Image from "next/image";
import Link from "next/link";

export type DynamicCmsBlock = {
  id?: string;
  type: string;
  order: number;
  props: Record<string, unknown>;
};

export type DynamicCmsPage = {
  id?: string;
  slug: string;
  title: string;
  status?: string;
  seo?: Record<string, unknown>;
  blocks: ReadonlyArray<DynamicCmsBlock>;
};

function getString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim() ? value : fallback;
}

function renderTitleBlock(block: DynamicCmsBlock) {
  const title = getString(block.props.title, "Untitled section");
  const subtitle = getString(block.props.subtitle, "");
  const description = getString(block.props.description, "");
  const isHero = block.type === "hero";
  const ctaPrimary = getString(block.props.ctaPrimary, "");
  const ctaSecondary = getString(block.props.ctaSecondary, "");
  const ctaPrimaryHref = getString(block.props.ctaPrimaryHref, "/subscription");
  const ctaSecondaryHref = getString(block.props.ctaSecondaryHref, "/about");

  return (
    <section key={block.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 md:p-12">
      <p className="mb-3 text-xs uppercase tracking-[0.28em] text-cyan-300">{getString(block.props.eyebrow, "Content")}</p>
      {isHero ? (
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">{title}</h1>
      ) : (
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">{title}</h2>
      )}
      {subtitle ? <p className="mt-3 text-lg text-cyan-200">{subtitle}</p> : null}
      {description ? <p className="mt-5 max-w-3xl text-base text-slate-300">{description}</p> : null}
      {(ctaPrimary || ctaSecondary) ? (
        <div className="mt-8 flex flex-wrap gap-4">
          {ctaPrimary ? (
            <Link href={ctaPrimaryHref} className="inline-flex rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950">
              {ctaPrimary}
            </Link>
          ) : null}
          {ctaSecondary ? (
            <Link href={ctaSecondaryHref} className="inline-flex rounded-full border border-cyan-400/40 bg-slate-900 px-6 py-3 font-semibold text-cyan-200">
              {ctaSecondary}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function renderFeatureList(block: DynamicCmsBlock) {
  const items = Array.isArray(block.props.items) ? block.props.items : [];
  return (
    <section key={block.id} className="grid gap-6 md:grid-cols-3">
      {items.map((item, index) => {
        const entry = item as Record<string, unknown>;
        return (
          <article key={`${block.id}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">{index + 1}</div>
            <h3 className="mb-2 text-xl font-bold text-white">{getString(entry.title, "Feature")}</h3>
            <p className="text-slate-300">{getString(entry.description, "")}</p>
          </article>
        );
      })}
    </section>
  );
}

function renderServiceList(block: DynamicCmsBlock) {
  const items = Array.isArray(block.props.items) ? block.props.items : [];
  return (
    <section key={block.id} className="grid gap-6 md:grid-cols-3">
      {items.map((item, index) => {
        const entry = item as Record<string, unknown>;
        return (
          <article key={`${block.id}-${index}`} className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-6">
            <div className="mb-3 text-cyan-300">{index + 1}</div>
            <h3 className="mb-2 text-xl font-semibold text-white">{getString(entry.title, "Service")}</h3>
            <p className="text-slate-300">{getString(entry.description, "")}</p>
          </article>
        );
      })}
    </section>
  );
}

function renderPricingBlock(block: DynamicCmsBlock) {
  const plans = Array.isArray((block.props as { plans?: unknown[] }).plans) ? ((block.props as { plans?: unknown[] }).plans ?? []) : [];
  return (
    <section key={block.id} className="grid gap-6 md:grid-cols-3">
      {plans.map((plan, index) => {
        const entry = plan as Record<string, unknown>;
        return (
          <article key={`${block.id}-${index}`} className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-6">
            <h3 className="text-xl font-bold text-white">{getString(entry.name, "Plan")}</h3>
            <p className="mt-3 text-3xl font-black text-cyan-300">{getString(entry.price, "Custom")}</p>
            <p className="mt-3 text-slate-300">{getString(entry.description, "")}</p>
            <Link href="/subscription" className="mt-6 inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200">Choose plan</Link>
          </article>
        );
      })}
    </section>
  );
}

function renderFaqBlock(block: DynamicCmsBlock) {
  const items = Array.isArray(block.props.items) ? block.props.items : [];
  return (
    <section key={block.id} className="space-y-4">
      {items.map((item, index) => {
        const entry = item as Record<string, unknown>;
        return (
          <div key={`${block.id}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <h3 className="mb-2 text-lg font-bold text-white">{getString(entry.question, "Question")}</h3>
            <p className="text-slate-300">{getString(entry.answer, "")}</p>
          </div>
        );
      })}
    </section>
  );
}

function renderGalleryBlock(block: DynamicCmsBlock) {
  const images = Array.isArray(block.props.images) ? block.props.images : [];
  return (
    <section key={block.id} className="grid gap-6 md:grid-cols-3">
      {images.map((image, index) => {
        const entry = image as Record<string, unknown>;
        return (
          <figure key={`${block.id}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
            <Image src={getString(entry.url, "/placeholder.svg")} alt={getString(entry.altText, "Gallery item")} width={900} height={640} className="h-64 w-full object-cover" />
            <figcaption className="p-4 text-sm text-slate-300">{getString(entry.caption, "Gallery item")}</figcaption>
          </figure>
        );
      })}
    </section>
  );
}

function renderStatsBlock(block: DynamicCmsBlock) {
  const items = Array.isArray(block.props.items) ? block.props.items : [];
  return (
    <section key={block.id} className="grid gap-6 md:grid-cols-4">
      {items.map((item, index) => {
        const entry = item as Record<string, unknown>;
        return (
          <div key={`${block.id}-${index}`} className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-6 text-center">
            <div className="text-3xl font-black text-cyan-300">{getString(entry.value, "0")}</div>
            <div className="mt-2 text-sm text-slate-300">{getString(entry.label, "Metric")}</div>
          </div>
        );
      })}
    </section>
  );
}

function renderTeamBlock(block: DynamicCmsBlock) {
  const members = Array.isArray(block.props.members) ? block.props.members : [];
  return (
    <section key={block.id} className="grid gap-6 md:grid-cols-3">
      {members.map((member, index) => {
        const entry = member as Record<string, unknown>;
        return (
          <article key={`${block.id}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <div className="mb-4 h-16 w-16 rounded-full bg-cyan-500/10 text-center text-xl leading-[4rem] text-cyan-300">{getString(entry.name, "A").slice(0, 1).toUpperCase()}</div>
            <h3 className="text-xl font-bold text-white">{getString(entry.name, "Team member")}</h3>
            <p className="mt-1 text-cyan-300">{getString(entry.role, "Role")}</p>
            <p className="mt-3 text-slate-300">{getString(entry.bio, "")}</p>
          </article>
        );
      })}
    </section>
  );
}

function renderTestimonialBlock(block: DynamicCmsBlock) {
  const items = Array.isArray(block.props.items) ? block.props.items : [];
  return (
    <section key={block.id} className="grid gap-6 md:grid-cols-3">
      {items.map((item, index) => {
        const entry = item as Record<string, unknown>;
        return (
          <blockquote key={`${block.id}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
            <p className="text-slate-200">{getString(entry.quote, "")}</p>
            <footer className="mt-4 text-sm text-cyan-300"><strong>{getString(entry.author, "Customer")}</strong> · {getString(entry.company, "")}</footer>
          </blockquote>
        );
      })}
    </section>
  );
}

function renderContactBlock(block: DynamicCmsBlock) {
  const ctaPrimary = getString(block.props.ctaPrimary, "");
  const ctaSecondary = getString(block.props.ctaSecondary, "");
  const ctaPrimaryHref = getString(block.props.ctaPrimaryHref, "/contact");
  const ctaSecondaryHref = getString(block.props.ctaSecondaryHref, "/about");

  return (
    <section key={block.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 md:p-12">
      <h2 className="text-3xl font-black text-white">{getString(block.props.title, "Contact us")}</h2>
      <p className="mt-3 text-slate-300">{getString(block.props.description, "")}</p>
      {(ctaPrimary || ctaSecondary) ? (
        <div className="mt-6 flex flex-wrap gap-4">
          {ctaPrimary ? (
            <Link href={ctaPrimaryHref} className="inline-flex rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950">{ctaPrimary}</Link>
          ) : null}
          {ctaSecondary ? (
            <Link href={ctaSecondaryHref} className="inline-flex rounded-full border border-cyan-400/40 bg-slate-900 px-6 py-3 font-semibold text-cyan-200">{ctaSecondary}</Link>
          ) : null}
        </div>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(Array.isArray(block.props.details) ? block.props.details : []).map((item, index) => {
          const entry = item as Record<string, unknown>;
          return (
            <div key={`${block.id}-${index}`} className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
              <div className="font-semibold text-cyan-300">{getString(entry.label, "Detail")}</div>
              <div className="mt-2 text-slate-200">{getString(entry.value, "")}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function renderFormBlock(block: DynamicCmsBlock) {
  const fields = Array.isArray(block.props.fields) ? block.props.fields : [];
  return (
    <section key={block.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-8">
      <h2 className="mb-4 text-2xl font-bold text-white">{getString(block.props.title, "Form")}</h2>
      <form className="grid gap-4 md:grid-cols-2">
        {fields.map((field, index) => {
          const entry = field as Record<string, unknown>;
          return (
            <label key={`${block.id}-${index}`} className="block text-sm text-slate-300">
              <span className="mb-2 block">{getString(entry.label, "Field")}</span>
              <input
                type={getString(entry.type, "text")}
                placeholder={getString(entry.placeholder, "")}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
              />
            </label>
          );
        })}
        <div className="md:col-span-2">
          <button type="submit" className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950">Submit</button>
        </div>
      </form>
    </section>
  );
}

function renderRichTextBlock(block: DynamicCmsBlock) {
  return (
    <section key={block.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6" dangerouslySetInnerHTML={{ __html: getString(block.props.content, "") }} />
  );
}

function renderCtaBlock(block: DynamicCmsBlock) {
  return (
    <section key={block.id} className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-slate-900 p-8 md:p-12">
      <h2 className="text-3xl font-black text-white">{getString(block.props.title, "Ready to move forward?")}</h2>
      <p className="mt-3 text-slate-300">{getString(block.props.description, "")}</p>
      <Link href={getString(block.props.href, "/contact")} className="mt-6 inline-flex rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950">{getString(block.props.label, "Get started")}</Link>
    </section>
  );
}

export function DynamicPageRenderer({ page }: { page: DynamicCmsPage }) {
  const blocks = [...(page.blocks ?? [])].sort((a, b) => a.order - b.order);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-20 pt-28 text-white">
      {blocks.map((block) => {
        const blockKey = block.id ?? `${page.slug}-${block.type}-${block.order}`;

        switch (block.type) {
          case "hero":
            return <div key={blockKey}>{renderTitleBlock(block)}</div>;
          case "features":
            return <div key={blockKey}>{renderFeatureList(block)}</div>;
          case "services":
            return <div key={blockKey}>{renderServiceList(block)}</div>;
          case "pricing":
            return <div key={blockKey}>{renderPricingBlock(block)}</div>;
          case "faq":
            return <div key={blockKey}>{renderFaqBlock(block)}</div>;
          case "gallery":
            return <div key={blockKey}>{renderGalleryBlock(block)}</div>;
          case "stats":
            return <div key={blockKey}>{renderStatsBlock(block)}</div>;
          case "team":
            return <div key={blockKey}>{renderTeamBlock(block)}</div>;
          case "testimonials":
            return <div key={blockKey}>{renderTestimonialBlock(block)}</div>;
          case "contact":
            return <div key={blockKey}>{renderContactBlock(block)}</div>;
          case "form":
            return <div key={blockKey}>{renderFormBlock(block)}</div>;
          case "richText":
            return <div key={blockKey}>{renderRichTextBlock(block)}</div>;
          case "cta":
          case "ctaButton":
            return <div key={blockKey}>{renderCtaBlock(block)}</div>;
          default:
            return <div key={blockKey}>{renderTitleBlock(block)}</div>;
        }
      })}
    </main>
  );
}
