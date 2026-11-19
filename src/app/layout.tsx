import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";

import { AppSessionProvider } from "@/components/providers/session-provider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL("https://phause.com"),
  title: "Phause | Phishing Simulation & Security Awareness",
  description:
    "Run phishing simulations, understand employee engagement and build a stronger security-awareness programme with Phause.",
  keywords: [
    "phishing simulation", "security awareness training", "phishing awareness",
    "employee security", "phause", "phishing campaign reporting",
  ],
  openGraph: {
    title: "Phause | Strengthen. Aware. Defend.",
    description: "Phishing simulations, employee insights and security-awareness training.",
    url: "https://phause.com",
    siteName: "Phause",
    images: ["/logo.png"],
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}