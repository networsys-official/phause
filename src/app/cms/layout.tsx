import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAccessCmsPage } from "@/lib/cms-access";

export const dynamic = "force-dynamic";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const hostname = (await headers()).get("host") ?? null;

  if (!canAccessCmsPage(session?.user ?? null, hostname)) {
    redirect("/auth/login?reason=session_required");
  }

  return <>{children}</>;
}
