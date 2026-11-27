"use client";

import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";
import { SimpleCmsResourceManager } from "@/components/cms/resource-manager";

export default function TestimonialsCmsPage() {
  const [items, setItems] = useState<Array<Record<string, string>>>([]);

  useEffect(() => {
    void fetch("/api/cms/pages?slug=about")
      .then((response) => response.json())
      .then((payload) => {
        const block = (payload.page?.blocks ?? []).find((entry: Record<string, unknown>) => String(entry.type ?? "").replace(/[_-]+/g, "").toLowerCase() === "testimonial");
        setItems(Array.isArray(block?.props?.items) ? block.props.items as Array<Record<string, string>> : []);
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <CmsShell title="Testimonials CMS" description="Manage the quotes and trust signals displayed on the homepage and sales pages.">
      <SimpleCmsResourceManager
        title="Testimonials"
        description="Add or update social proof without changing the front-end layout."
        endpoint="/api/cms/testimonials"
        itemName="Testimonial"
        fields={[
          { key: "author", label: "Author", type: "text" },
          { key: "role", label: "Role", type: "text" },
          { key: "company", label: "Company", type: "text" },
          { key: "quote", label: "Quote", type: "textarea" },
          { key: "slug", label: "Slug", type: "text" },
          { key: "status", label: "Status", type: "select", options: ["DRAFT", "PUBLISHED"] },
        ]}
        defaultItem={{ id: "", author: "", role: "", company: "", quote: "", slug: "", status: "DRAFT" }}
        initialItems={items}
      />
    </CmsShell>
  );
}
