"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  Phone,
  Heart,
  Home,
  Building2,
  Users,
  MessageCircle,
  MapPin,
  Instagram,
  Facebook,
} from "lucide-react";
import { motion } from "framer-motion";
import { buttonVariants } from "@/lib/button-variants";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";
import { OFFICE } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/nosotros", label: "Nosotros", icon: Users },
  { href: "/contacto", label: "Contacto", icon: MessageCircle },
];

// Pages that have a dark hero section where the header overlays
const DARK_HERO_PAGES = ["/", "/contacto", "/nosotros", "/favoritos"];

export function Header() {
  const pathname = usePathname();
  const hasDarkHero = DARK_HERO_PAGES.includes(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { favorites } = useFavorites();
  const favCount = favorites.length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile sheet whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isTransparent = hasDarkHero && !scrolled;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isTransparent
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(28,28,28,0.06)]"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
        <Link href="/" className="flex items-center gap-3" aria-label="UCCI Propiedades">
          <span
            className={cn(
              "grid place-items-center rounded-2xl transition-colors",
              isTransparent ? "bg-white/95 px-3 py-2" : "bg-brand px-3 py-2"
            )}
          >
            <Image
              src="/logo-ucci.svg"
              alt="UCCI Propiedades"
              width={220}
              height={95}
              className="h-12 w-auto md:h-14"
              priority
            />
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium tracking-wide transition-colors",
                  isTransparent
                    ? "text-white/90 hover:text-white"
                    : "text-ink/70 hover:text-ink",
                  active &&
                    (isTransparent
                      ? "text-white after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-px after:bg-brand"
                      : "text-ink after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-px after:bg-brand-dark")
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/favoritos"
            aria-label="Favoritos"
            className={cn(
              "relative grid h-10 w-10 place-items-center rounded-full transition-colors",
              isTransparent
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-ink/5 text-ink hover:bg-ink/10",
              pathname === "/favoritos" &&
                (isTransparent ? "bg-white/25" : "bg-brand-soft text-brand-dark")
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                favCount > 0 && "fill-red-500 text-red-500"
              )}
            />
            {favCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {favCount > 99 ? "99+" : favCount}
              </span>
            )}
          </Link>
          <Link
            href="/contacto"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-brand text-ink hover:bg-brand-dark hover:text-white shadow-sm px-5"
            )}
          >
            <Phone className="mr-2 h-4 w-4" />
            Contacto
          </Link>
        </nav>

        {/* Mobile Nav */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className={cn(
              "md:hidden grid h-11 w-11 place-items-center rounded-full transition-colors",
              isTransparent
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-ink/5 text-ink hover:bg-ink/10"
            )}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-[86vw] max-w-sm flex-col bg-ink p-0 text-white border-l-0"
          >
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>

            {/* Sheet header with logo */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="inline-flex"
                aria-label="UCCI Propiedades"
              >
                <span className="rounded-xl bg-brand px-2.5 py-1.5">
                  <Image
                    src="/logo-ucci.svg"
                    alt="UCCI Propiedades"
                    width={160}
                    height={68}
                    className="h-9 w-auto"
                  />
                </span>
              </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-4">
              <p className="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Navegación
              </p>
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => {
                  const active = pathname === link.href;
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors",
                          active
                            ? "bg-brand text-ink"
                            : "text-white/80 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="my-4 h-px bg-white/10" />

              <Link
                href="/favoritos"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors",
                  pathname === "/favoritos"
                    ? "bg-brand text-ink"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <Heart
                    className={cn(
                      "h-5 w-5",
                      favCount > 0 && "fill-red-500 text-red-500"
                    )}
                  />
                  Favoritos
                </span>
                {favCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {favCount}
                  </span>
                )}
              </Link>
            </nav>

            {/* Footer */}
            <div className="border-t border-white/10 px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-3">
                Oficina
              </p>
              <div className="space-y-2 text-sm text-white/70">
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand" />
                  <span>
                    {OFFICE.address}
                    <br />
                    <span className="text-white/50">{OFFICE.city}</span>
                  </span>
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2">
                <a
                  href={OFFICE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-brand hover:text-ink hover:border-brand"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href={OFFICE.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-brand hover:text-ink hover:border-brand"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
}
