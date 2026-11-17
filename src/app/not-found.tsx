import type { Metadata } from "next";

import { BrandNotFound } from "@/components/brand-not-found";

export const metadata: Metadata = {
  title: "404 | Phause",
  description: "Page not found.",
};

export default function NotFoundPage() {
  return <BrandNotFound />;
}
