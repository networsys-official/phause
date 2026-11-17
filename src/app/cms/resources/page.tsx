import Link from "next/link";

import { CmsShell } from "@/components/cms/admin-shell";
import { GenericCmsResourceCreator } from "@/components/cms/resource-manager";

const resources = [
  { href: "/cms/blog", label: "Blog", description: "Publish articles and route them through /blog/[slug]." },
  { href: "/cms/docs", label: "Docs", description: "Maintain documentation and knowledge base entries." },
  { href: "/cms/faqs", label: "FAQs", description: "Manage help and support entries for the public FAQ view." },
  { href: "/cms/services", label: "Services", description: "Create service offers and service detail content." },
  { href: "/cms/testimonials", label: "Testimonials", description: "Curate client quotes and trust signals." },
  { href: "/cms/pages", label: "Pages", description: "Edit page blocks and sections in the CMS editor." },
  { href: "/cms/navigation", label: "Navigation", description: "Manage menu entries and primary site links." },
  { href: "/cms/footer", label: "Footer", description: "Edit footer content and link groups." },
];

export default function CmsResourcesPage() {
  return (
    <CmsShell title="CMS resource management" description="Create, edit, and delete the major content collections without altering the app code.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-[26px] border border-slate-800 bg-[#0b1218]/85 p-5 shadow-[0_18px_45px_rgba(2,6,23,0.28)] transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-slate-900/80"
          >
            <div className="flex items-center justify-between">
              <div className="text-xl font-semibold text-white">{item.label}</div>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">Open</span>
            </div>
            <div className="mt-5 text-sm text-slate-400">{item.description}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <GenericCmsResourceCreator />
      </div>
    </CmsShell>
  );
}
