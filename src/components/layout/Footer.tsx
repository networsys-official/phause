"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import Logo from "../../../public/logo/phause-logo.png";
import { FacebookIcon } from "@/components/icons/lucide-facebook";
import { InstagramIcon } from "@/components/icons/lucide-instagram";
import { LinkedinIcon } from "@/components/icons/lucide-linkedin";
import { FOOTER_LEGAL_LINKS, FOOTER_LINKS, FOOTER_SERVICES } from "@/lib/routes";

const SOCIALS = [
  { icon: FacebookIcon, href: "https://www.facebook.com", label: "Facebook" },
  { icon: LinkedinIcon, href: "https://www.linkedin.com", label: "LinkedIn" },
  { icon: InstagramIcon, href: "https://www.instagram.com", label: "Instagram" },
];

export default function Footer() {
  const [footer, setFooter] = useState({
    title: "Phause",
    description:
      "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.",
    copyright: "Strengthen. Aware. Defend.",
    links: FOOTER_SERVICES,
  });
  const [navigation, setNavigation] = useState({ items: FOOTER_LINKS });
  const [supportEmail, setSupportEmail] = useState("hello@phause.com");
  const [supportPhone, setSupportPhone] = useState("+1 (555) 010-PHAUSE");
  const [locationLabel, setLocationLabel] = useState("San Francisco, CA");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    let active = true;

    Promise.all([fetch("/api/footer"), fetch("/api/navigation")])
      .then(async ([footerResponse, navigationResponse]) => {
        const footerPayload = await footerResponse.json();
        const navigationPayload = await navigationResponse.json();

        if (!active) {
          return;
        }

        if (footerPayload?.footer) {
          const cmsLinks = Array.isArray(footerPayload.footer.links) && footerPayload.footer.links.length > 0 ? footerPayload.footer.links : FOOTER_SERVICES;
          setFooter((current) => ({
            title: footerPayload.footer.title ?? "Phause",
            description: footerPayload.footer.description ?? current.description,
            copyright: footerPayload.footer.copyright ?? current.copyright,
            links: cmsLinks,
          }));
        }

        if (navigationPayload?.navigation?.items?.length) {
          setNavigation({ items: navigationPayload.navigation.items });
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

  const quickLinks = Array.isArray(navigation.items) && navigation.items.length > 0
    ? navigation.items.filter((link) => ["Home", "About Us", "Services", "Blog", "Docs", "Subscription", "FAQ", "Contact Us"].includes(link.label))
      .slice(0, 8)
    : FOOTER_LINKS;

  const serviceLinks = Array.isArray(footer.links) && footer.links.length > 0
    ? footer.links.filter((link) => ["Threat Detection", "Security Audits", "Cloud Protection", "Data Encryption"].includes(link.label) || ["/services#threat-detection", "/services#security-audits", "/services#cloud-protection", "/services#data-encryption"].includes(link.href))
      .slice(0, 4)
    : FOOTER_SERVICES;

  const legalLinks = FOOTER_LEGAL_LINKS;

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
              <Image
                src={Logo}
                alt={footer.title || "Phause Logo"}
                width={220}
                height={80}
                priority
                sizes="(max-width: 768px) 160px, 220px"
                className="h-20 w-auto"
              />
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

          <div>
            <h4 className="mb-5 text-lg font-bold">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
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

          <div>
            <h4 className="mb-5 text-lg font-bold">Services</h4>
            <ul className="space-y-3">
              {serviceLinks.map((s, index) => (
                <li key={`${s.label}-${index}`}>
                  <div className="transition-transform duration-200 hover:translate-x-1.5">
                    <Link href={s.href} className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-phause-cyan">
                      <span className="h-1.5 w-1.5 rounded-full bg-phause-cyan/50" />
                      {s.label}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-lg font-bold">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
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
            <Link href="/privacy-policy" className="transition-colors hover:text-phause-cyan">Privacy Policy</Link>
            <Link href="/terms-of-service" className="transition-colors hover:text-phause-cyan">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
