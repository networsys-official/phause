"use client";

import { useEffect, useState } from "react";

import { CmsShell } from "@/components/cms/admin-shell";
import { SimpleCmsResourceManager } from "@/components/cms/resource-manager";

export default function ServicesCmsPage() {
  const [items, setItems] = useState<Array<Record<string, string>>>([]);

  useEffect(() => {
    void fetch("/api/cms/services")
      .then((response) => response.json())
      .then((payload) => setItems(Array.isArray(payload.items) ? payload.items : []))
      .catch(() => setItems([]));
  }, []);

  return (
    <CmsShell title="Services CMS" description="Manage the service offers and feature blocks shown on the public Services page.">
      <SimpleCmsResourceManager
        title="Services"
        description="The service catalog is editable from the CMS and is bound to the current section layout."
        endpoint="/api/cms/services"
        itemName="Service"
        emptyState={{
          title: "No services configured yet",
          description: "Add your first offer to surface the right solutions for prospects and clients.",
        }}
        fields={[
          { key: "title", label: "Title", type: "text" },
          { key: "slug", label: "Slug", type: "text" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "image", label: "Image", type: "image" },
          { key: "status", label: "Status", type: "select", options: ["DRAFT", "PUBLISHED"] },
        ]}
        defaultItem={{ id: "", title: "", slug: "", description: "", image: "", status: "DRAFT" }}
        initialItems={items}
      />
    </CmsShell>
  );
}
