import Link from "next/link";

export type CmsBlockPayload = {
  id: string;
  type: string;
  order: number;
  props: Record<string, unknown>;
};

type FeatureItem = {
  title?: string;
  description?: string;
};

type FaqItem = {
  question?: string;
  answer?: string;
};

type PlanItem = {
  name?: string;
  price?: string;
};

export function CmsPageRenderer({ page }: { page: { slug: string; title: string; blocks: CmsBlockPayload[] } }) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl md:text-6xl font-black mb-8">{page.title}</h1>
      <div className="space-y-8">
        {page.blocks.map((block) => {
          switch (block.type) {
            case "hero": {
              const title = String((block.props.title as string) ?? "");
              const description = String((block.props.description as string) ?? "");
              const eyebrow = String((block.props.eyebrow as string) ?? "");
              return (
                <section key={block.id} className="rounded-3xl border border-phause-cyan/20 bg-slate-900/60 p-8 md:p-12">
                  <p className="text-xs uppercase tracking-[0.3em] text-phause-cyan mb-4">{eyebrow}</p>
                  <h2 className="text-3xl md:text-5xl font-black mb-4">{title}</h2>
                  <p className="text-slate-300 text-lg max-w-3xl">{description}</p>
                </section>
              );
            }
            case "features": {
              const items = Array.isArray(block.props.items) ? (block.props.items as FeatureItem[]) : [];
              return (
                <section key={block.id} className="grid md:grid-cols-3 gap-6">
                  {items.map((item, index) => (
                    <article key={`${block.id}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                      <h3 className="text-xl font-bold mb-2">{String(item.title ?? "Feature")}</h3>
                      <p className="text-slate-300">{String(item.description ?? "")}</p>
                    </article>
                  ))}
                </section>
              );
            }
            case "faq": {
              const items = Array.isArray(block.props.items) ? (block.props.items as FaqItem[]) : [];
              return (
                <section key={block.id} className="space-y-4">
                  {items.map((item, index) => (
                    <div key={`${block.id}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
                      <h3 className="font-bold text-lg mb-2">{String(item.question ?? "")}</h3>
                      <p className="text-slate-300">{String(item.answer ?? "")}</p>
                    </div>
                  ))}
                </section>
              );
            }
            case "pricing": {
              const plans = Array.isArray((block.props as { plans?: PlanItem[] }).plans) ? ((block.props as { plans?: PlanItem[] }).plans ?? []) : [];
              return (
                <section key={block.id} className="grid md:grid-cols-3 gap-6">
                  {plans.map((plan, index) => (
                    <article key={`${block.id}-${index}`} className="rounded-2xl border border-phause-cyan/20 bg-slate-900/80 p-6">
                      <h3 className="text-xl font-bold mb-2">{String(plan.name ?? "Plan")}</h3>
                      <p className="text-3xl font-black text-phause-cyan mb-3">{String(plan.price ?? "Custom")}</p>
                      <Link href="/subscription" className="inline-flex rounded-full border border-phause-cyan/40 px-4 py-2 text-sm text-phause-cyan">Choose plan</Link>
                    </article>
                  ))}
                </section>
              );
            }
            case "richText": {
              return <div key={block.id} dangerouslySetInnerHTML={{ __html: String(block.props.content ?? "") }} />;
            }
            case "contact": {
              return (
                <section key={block.id} className="rounded-3xl border border-white/10 bg-slate-900/70 p-8">
                  <h3 className="text-2xl font-bold mb-2">{String(block.props.title ?? "Contact")}</h3>
                  <p className="text-slate-300">{String(block.props.description ?? "")}</p>
                </section>
              );
            }
            default:
              return (
                <section key={block.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
                  <p className="text-slate-300">{String(block.type)}</p>
                </section>
              );
          }
        })}
      </div>
    </div>
  );
}
