"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { getToken, clearToken } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import Logo from "../../../public/logo/phause-logo.png";
import RegistrationModal from "@/components/registration/RegistrationModal";
import LoginModal from "@/components/auth/LoginModal";
import { NAV_LINKS, ROUTES } from "@/lib/routes";

const AUTH_CHANGE_EVENT = "phause-auth-change";

function subscribeToAuthChanges(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
  };
}

export default function Navbar({ initialBrandName = "Phause", initialLogoUrl = "/logo/phause-logo.png" }: { initialBrandName?: string; initialLogoUrl?: string } = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [navLinks, setNavLinks] = useState<{ label: string; href: string }[]>(NAV_LINKS);
  const [brandName, setBrandName] = useState(initialBrandName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const router = useRouter();
  const pathname = usePathname();
  const isLoggedIn = useSyncExternalStore(
    subscribeToAuthChanges,
    () => Boolean(getToken()),
    () => false,
  );

  const isActiveRoute = (href: string) => href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const loadNavigation = async () => {
      try {
        const response = await fetch("/api/navigation", { cache: "no-store" });
        const payload = await response.json();

        if (payload?.navigation?.items) {
          setNavLinks(payload.navigation.items
            .filter((item: { status?: string; deletedAt?: string | null }) => item.status !== "DRAFT" && item.status !== "ARCHIVED" && !item.deletedAt)
            .map((item: { label: string; href: string }) => ({ label: item.label, href: item.href })));
        } else {
          setNavLinks([]);
        }

        try {
          const settingsResponse = await fetch("/api/settings", { cache: "no-store" });
          const settingsPayload = await settingsResponse.json();
          if (settingsPayload?.settings?.siteName) setBrandName(settingsPayload.settings.siteName);
          if (settingsPayload?.settings?.logoUrl) setLogoUrl(settingsPayload.settings.logoUrl);
        } catch {
          // published settings fallback is handled by the API
        }

        if (payload?.navigation?.label) {
          setBrandName(payload.navigation.label.replace(" navigation", ""));
        }
      } catch {
        setNavLinks(NAV_LINKS);
      }
    };

    void loadNavigation();
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "glass py-3 shadow-[0_8px_40px_rgba(0,216,201,0.08)]" : "py-6"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link href={ROUTES.home} className="flex items-center gap-3" aria-label={brandName}>
              {logoUrl.startsWith("http") ? (
                <img src={logoUrl} alt={brandName || "Phause Logo"} width={600} height={200} className="h-20 w-auto" />
              ) : (
                <Image src={logoUrl || Logo} alt={brandName || "Phause Logo"} width={600} height={200} className="h-20 w-auto" priority />
              )}
            </Link>
          </motion.div>

          <div className="hidden min-w-0 items-center gap-2 xl:flex">
            {navLinks.map((link, i) => (
              <motion.div
                key={`${link.label}-${i}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ y: -2 }}
                className="relative"
              >
                <Link
                  href={link.href}
                  className={`group relative whitespace-nowrap text-xs 2xl:text-sm font-medium transition-colors ${isActiveRoute(link.href) ? "text-phause-cyan" : "text-slate-300 hover:text-phause-cyan"}`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-[2px] bg-phause-cyan transition-all duration-300 ${isActiveRoute(link.href) ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              </motion.div>
            ))}

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => window.location.assign("https://phause-sumit.vercel.app")}
                  className="rounded-full border border-phause-cyan/40 px-5 py-2.5 text-sm font-semibold text-phause-cyan transition-all duration-300 hover:bg-phause-cyan/10 hover:shadow-[0_0_20px_rgba(0,216,201,0.35)]"
                >
                  Go to Workplace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearToken();
                    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
                    router.refresh();
                  }}
                  className="rounded-full border border-phause-cyan/40 px-5 py-2.5 text-sm font-semibold text-phause-cyan transition-all duration-300 hover:bg-phause-cyan/10 hover:shadow-[0_0_20px_rgba(0,216,201,0.35)]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="rounded-full border border-phause-cyan/40 px-5 py-2.5 text-sm font-semibold text-phause-cyan transition-all duration-300 hover:bg-phause-cyan/10 hover:shadow-[0_0_20px_rgba(0,216,201,0.35)]"
                >
                  Login
                </button>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRegistrationOpen(true)}
                  className="group relative flex items-center gap-1.5 overflow-hidden rounded-full px-6 py-2.5 text-sm font-bold text-phause-dark"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-phause-cyan via-cyan-400 to-phause-teal bg-[length:200%_100%] transition-all duration-500 group-hover:bg-[position:100%_0]" />
                  <span className="relative flex items-center gap-1.5">
                    Register <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-phause-cyan xl:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass mx-4 mt-3 overflow-hidden rounded-2xl"
            >
              <div className="flex flex-col gap-5 p-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`font-medium transition-colors ${isActiveRoute(link.href) ? "text-phause-cyan" : "text-slate-200 hover:text-phause-cyan"}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex gap-4 border-t border-phause-border pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setLoginOpen(true);
                    }}
                    className="flex-1 rounded-full border border-phause-cyan/40 px-4 py-2.5 text-center font-semibold text-phause-cyan"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setRegistrationOpen(true);
                    }}
                    className="flex-1 rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal px-4 py-2.5 text-center font-bold text-phause-dark"
                  >
                    Register
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      <RegistrationModal open={registrationOpen} onClose={() => setRegistrationOpen(false)} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
