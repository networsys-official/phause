import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateCmsState(slug?: string) {
  try {
    revalidateTag("cms-pages", "max");
    revalidateTag("cms-seo", "max");
    revalidateTag("cms-navigation", "max");
    revalidateTag("cms-footer", "max");
    revalidateTag("cms-settings", "max");
    revalidatePath("/");
    if (slug) revalidatePath(`/${slug === "home" ? "" : slug}`);
    revalidatePath("/sitemap.xml");
  } catch {
    // Cache APIs can be unavailable outside a Next.js request/render context.
  }
}
