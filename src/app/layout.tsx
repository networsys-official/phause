import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";

import { AppSessionProvider } from "@/components/providers/session-provider";
import { cn } from "@/lib/utils";
import { liveSiteDefaults } from "@/features/cms/seed-defaults";
import { getPublishedSettings } from "@/features/cms/settings-public";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublishedSettings();
  const title = `${settings.siteName} | ${liveSiteDefaults.title.includes(" | ") ? liveSiteDefaults.title.split(" | ").slice(1).join(" | ") : "Strengthen. Aware. Defend."}`;
  return {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://phause.com"),
  title,
  description:
    "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
  keywords: [
    "phishing simulation", "security awareness training", "phishing awareness",
    "employee security", "phause", "phishing campaign reporting",
  ],
  openGraph: {
    title,
    description: "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
    url: "https://phause.com",
    siteName: settings.siteName,
    images: ["/logo.png"],
    type: "website",
  },
  robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}