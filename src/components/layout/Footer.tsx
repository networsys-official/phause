"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import Logo from "../../../public/logo/phause-logo.png";
import { FacebookIcon } from "@/components/icons/lucide-facebook";
import { InstagramIcon } from "@/components/icons/lucide-instagram";
import { LinkedinIcon } from "@/components/icons/lucide-linkedin";
import { FALLBACK_FOOTER_LINKS, groupFooterLinks, type FooterCmsLink } from "@/features/cms/footer-groups";

const SOCIALS = [
  { icon: FacebookIcon, href: "https://www.facebook.com", label: "Facebook" },
  { icon: LinkedinIcon, href: "https://www.linkedin.com", label: "LinkedIn" },
  { icon: InstagramIcon, href: "https://www.instagram.com", label: "Instagram" },
];

export default function Footer({ initialSupportEmail = "hello@phause.com", initialSupportPhone = "+1 (555) 010-PHAUSE", initialLogoUrl = "/logo/phause-logo.png", initialBrandName = "Phause" }: { initialSupportEmail?: string; initialSupportPhone?: string; initialLogoUrl?: string; initialBrandName?: string } = {}) {
  const [footer, setFooter] = useState({
    title: "Phause",
    description:
      "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
    copyright: "Strengthen. Aware. Defend.",
    links: FALLBACK_FOOTER_LINKS,
  });
  const [supportEmail, setSupportEmail] = useState(initialSupportEmail);
  const [supportPhone, setSupportPhone] = useState(initialSupportPhone);
  const [locationLabel, setLocationLabel] = useState("San Francisco, CA");
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let active = true;

    fetch("/api/footer")
      .then(async (footerResponse) => {
        const footerPayload = await footerResponse.json();

        if (!active) {
          return;
        }

        try {
          const settingsResponse = await fetch("/api/settings");
          const settingsPayload = await settingsResponse.json();
          if (settingsPayload?.settings?.supportEmail) setSupportEmail(settingsPayload.settings.supportEmail);
          if (settingsPayload?.settings?.supportPhone) setSupportPhone(settingsPayload.settings.supportPhone);
          if (settingsPayload?.settings?.logoUrl) setLogoUrl(settingsPayload.settings.logoUrl);
        } catch {
          // defaults remain when published settings are unavailable
        }

        if (footerPayload?.footer) {
          const cmsLinks = Array.isArray(footerPayload.footer.links) && footerPayload.footer.links.length > 0 ? footerPayload.footer.links : FALLBACK_FOOTER_LINKS;
          setFooter((current) => ({
            title: footerPayload.footer.title ?? "Phause",
            description: footerPayload.footer.description ?? current.description,
            copyright: footerPayload.footer.copyright ?? current.copyright,
            links: cmsLinks,
          }));
        }

        const emailLink = footerPayload?.footer?.links?.find((link: { href?: string; label?: string }) => link.href?.includes("@"));
        if (emailLink?.href) setSupportEmail(emailLink.href.replace("mailto:", ""));

        const phoneLink = footerPayload?.footer?.links?.find((link: { href?: string; label?: string }) => link.href?.startsWith("tel:"));
        if (phoneLink?.href) setSupportPhone(phoneLink.href.replace("tel:", ""));

        const locationLink = footerPayload?.footer?.links?.find((link: { href?: string; label?: string }) => link.href?.includes("maps") || link.label?.toLowerCase().includes("location"));
        if (locationLink?.label) setLocationLabel(locationLink.label);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const footerLinks: FooterCmsLink[] = Array.isArray(footer.links) && footer.links.length > 0
    ? footer.links
    : FALLBACK_FOOTER_LINKS;
  const footerGroups = groupFooterLinks(footerLinks);

  return (
    <footer id="contact-us" className="relative overflow-hidden pb-10 pt-24">
      <div className="absolute left-0 right-0 top-0">
        <svg viewBox="0 0 1440 100" className="h-20 w-full opacity-30">
          <path d="M0,50 C240,100 480,0 720,50 C960,100 1200,0 1440,50" fill="none" stroke="#00d8c9" strokeWidth="2" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-1/4 h-[300px] w-[600px] rounded-full bg-phause-cyan/8 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div className="mb-5 flex items-center gap-3">
              {logoUrl.startsWith("http") ? <img src={logoUrl} alt={initialBrandName || footer.title || "Phause Logo"} width={600} height={200} className="h-20 w-auto" /> : <Image
                src={logoUrl || Logo}
                alt={initialBrandName || footer.title || "Phause Logo"}
                width={600}
                height={200}
                priority
                sizes="(max-width: 768px) 160px, 220px"
                className="h-20 w-auto"
              />}
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">{footer.description}</p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="glass flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:border-phause-cyan/50 hover:text-phause-cyan"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.type}>
              <h4 className="mb-5 text-lg font-bold">{group.title}</h4>
              <ul className="space-y-3">
                {group.items.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <div className="transition-transform duration-200 hover:translate-x-1.5">
                      <Link href={link.href} className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-phause-cyan">
                        <span className="h-1.5 w-1.5 rounded-full bg-phause-cyan/50" />
                        {link.label}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-5 text-lg font-bold">Contact</h4>
            <div className="mt-6 space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-phause-cyan" /> {supportEmail}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-phause-cyan" /> {supportPhone}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-phause-cyan" /> {locationLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-phause-border pt-8 md:flex-row">
          <p className="text-sm text-slate-500">© {currentYear} Phause. All rights reserved. {footer.copyright}</p>
          <div className="flex gap-6 text-sm text-slate-500">
            {(footerGroups.find((group) => group.type === "LEGAL")?.items ?? []).map((link) => (
              <Link key={`${link.label}-${link.href}`} href={link.href} className="transition-colors hover:text-phause-cyan">{link.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
