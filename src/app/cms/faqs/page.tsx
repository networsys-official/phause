"use client";

import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";
import { SimpleCmsResourceManager } from "@/components/cms/resource-manager";

export default function FaqCmsPage() {
  const [items, setItems] = useState<Array<Record<string, string>>>([]);

  useEffect(() => {
    void fetch("/api/cms/faqs")
      .then((response) => response.json())
      .then((payload) => setItems(Array.isArray(payload.items) ? payload.items : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <CmsShell title="FAQ CMS" description="Create and publish common questions for the help center and support pages.">
      <SimpleCmsResourceManager
        title="Frequently asked questions"
        description="Each question supports content editing directly from the CMS and can be reused across the site."
        endpoint="/api/cms/faqs"
        itemName="FAQ"
        emptyState={{
          title: "No FAQs published yet",
          description: "Create your first question to start guiding visitors through the support experience.",
        }}
        fields={[
          { key: "question", label: "Question", type: "text" },
          { key: "answer", label: "Answer", type: "textarea" },
          { key: "slug", label: "Slug", type: "text" },
          { key: "status", label: "Status", type: "select", options: ["DRAFT", "PUBLISHED"] },
        ]}
        defaultItem={{ id: "", question: "", answer: "", slug: "", status: "DRAFT" }}
        initialItems={items}
      />
    </CmsShell>
  );
}
