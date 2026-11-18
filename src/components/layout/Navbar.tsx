"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { getToken, clearToken, AUTH_CHANGE_EVENT } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X, LogOut, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import Logo from "../../../public/logo/phause-logo.png";
import RegistrationModal from "@/components/registration/RegistrationModal";
import LoginModal from "@/components/auth/LoginModal";
import { NAV_LINKS, ROUTES } from "@/lib/routes";

function subscribeToAuthChanges(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
  };
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [navLinks, setNavLinks] = useState<
    { label: string; href: string }[]
  >(NAV_LINKS);

  const [brandName, setBrandName] = useState("Phause");

  const router = useRouter();

  // Reactive authentication state
  const isLoggedIn = useSyncExternalStore(
    subscribeToAuthChanges,
    () => Boolean(getToken()),
    () => false
  );

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Load CMS navigation
 useEffect(() => {
  const loadNavigation = async () => {
    try {
      const response = await fetch("/api/navigation", {
        cache: "no-store",
      });

      if (!response.ok) {
        console.warn(
          `Navigation API returned HTTP ${response.status}. Using default navigation.`
        );

        setNavLinks(NAV_LINKS);
        return;
      }

      const payload = await response.json();

      if (payload?.navigation?.items?.length) {
        const cmsItems = payload.navigation.items
          .filter(
            (item: { label?: string; href?: string }) =>
              item.label && item.href
          )
          .map((item: { label: string; href: string }) => ({
            label: item.label,
            href: item.href,
          }));

        if (cmsItems.length > 0) {
          setNavLinks(cmsItems);
        }
      }

      if (payload?.navigation?.label) {
        setBrandName(
          payload.navigation.label.replace(" navigation", "")
        );
      }
    } catch (error) {
      console.error("Navigation loading failed:", error);
      setNavLinks(NAV_LINKS);
    }
  };

  void loadNavigation();
}, []);

  // Navigate to existing workplace route
const handleWorkplace = () => {
  setOpen(false);
  window.location.href = "https://phause-sumit.vercel.app/dashboard";
};
  // Logout
  const handleLogout = () => {
    clearToken();

    // Notify all components about authentication changes
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));

    setOpen(false);
    router.refresh();
  };

  // Open login modal
  const handleLogin = () => {
    setOpen(false);
    setLoginOpen(true);
  };

  // Open registration modal
  const handleRegister = () => {
    setOpen(false);
    setRegistrationOpen(true);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass py-3 shadow-[0_8px_40px_rgba(0,216,201,0.08)]"
            : "py-6"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">

          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link
              href={ROUTES.home}
              className="flex items-center gap-3"
              aria-label={brandName}
            >
              <Image
                src={Logo}
                alt={brandName || "Phause Logo"}
                className="h-20 w-full"
                priority
              />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 lg:flex">

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
                  className="group relative text-sm font-medium text-slate-300 transition-colors hover:text-phause-cyan"
                >
                  {link.label}

                  <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-phause-cyan transition-all duration-300 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}

            {/* Authenticated Desktop Actions */}
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={handleWorkplace}
                  className="flex items-center gap-2 rounded-full border border-phause-cyan/40 px-5 py-2.5 text-sm font-semibold text-phause-cyan transition-all duration-300 hover:bg-phause-cyan/10 hover:shadow-[0_0_20px_rgba(0,216,201,0.35)]"
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  Go to Workplace
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-full border border-phause-cyan/40 px-5 py-2.5 text-sm font-semibold text-phause-cyan transition-all duration-300 hover:bg-phause-cyan/10 hover:shadow-[0_0_20px_rgba(0,216,201,0.35)]"
                >
                  <LogOut className="h-4 w-4" />
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
                    Register
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </motion.button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="p-2 text-phause-cyan lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? (
              <X className="h-7 w-7" />
            ) : (
              <Menu className="h-7 w-7" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass mx-4 mt-3 overflow-hidden rounded-2xl lg:hidden"
            >
              <div className="flex flex-col gap-5 p-6">

                {/* Navigation Links */}
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="font-medium text-slate-200 transition-colors hover:text-phause-cyan"
                  >
                    {link.label}
                  </Link>
                ))}

                {/* Mobile Authentication Actions */}
                <div className="flex flex-col gap-3 border-t border-phause-border pt-4">

                  {isLoggedIn ? (
                    <>
                      <button
                        type="button"
                        onClick={handleWorkplace}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-phause-cyan/40 px-4 py-3 font-semibold text-phause-cyan transition-all hover:bg-phause-cyan/10"
                      >
                        <BriefcaseBusiness className="h-4 w-4" />
                        Go to Workplace
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-phause-cyan/40 px-4 py-3 font-semibold text-phause-cyan transition-all hover:bg-phause-cyan/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleLogin}
                        className="w-full rounded-full border border-phause-cyan/40 px-4 py-3 text-center font-semibold text-phause-cyan transition-all hover:bg-phause-cyan/10"
                      >
                        Login
                      </button>

                      <button
                        type="button"
                        onClick={handleRegister}
                        className="w-full rounded-full bg-gradient-to-r from-phause-cyan to-phause-teal px-4 py-3 text-center font-bold text-phause-dark transition-all hover:opacity-90"
                      >
                        Register
                        <ArrowRight className="ml-2 inline h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Authentication Modals */}
      <RegistrationModal
        open={registrationOpen}
        onClose={() => setRegistrationOpen(false)}
      />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </>
  );
}