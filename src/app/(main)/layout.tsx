import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { getPublishedSettings } from "@/features/cms/settings-public";

/**
 * Shared layout for all main pages (Home, About, etc.).
 * Provides the Navbar and Footer automatically — no need to add them in individual page files.
 * This uses a Next.js route group `(main)` so it doesn't affect the URL structure.
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublishedSettings();
  return (
    <div className="bg-phause-dark text-white overflow-hidden">
      <Navbar initialBrandName={settings.siteName} initialLogoUrl={settings.logoUrl} />
      <main>{children}</main>
      <Footer initialBrandName={settings.siteName} initialLogoUrl={settings.logoUrl} initialSupportEmail={settings.supportEmail} initialSupportPhone={settings.supportPhone} />
    </div>
  );
}
