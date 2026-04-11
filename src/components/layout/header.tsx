"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Menu, Phone, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { buttonVariants } from "@/lib/button-variants";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

// Pages that have a dark hero section where the header overlays
const DARK_HERO_PAGES = ["/", "/contacto", "/nosotros", "/favoritos"];

export function Header() {
  const pathname = usePathname();
  const hasDarkHero = DARK_HERO_PAGES.includes(pathname);
  const [scrolled, setScrolled] = useState(false);
  const { favorites } = useFavorites();
  const favCount = favorites.length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
        <Sheet>
          <SheetTrigger className="md:hidden p-2" aria-label="Abrir menú">
            <Menu className={cn("h-6 w-6", isTransparent ? "text-white" : "text-ink")} />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-white">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <div className="mt-8 flex flex-col gap-4">
              <Link href="/" className="mb-4 inline-flex">
                <span className="rounded-2xl bg-brand px-3 py-2">
                  <Image
                    src="/logo-ucci.svg"
                    alt="UCCI Propiedades"
                    width={200}
                    height={85}
                    className="h-12 w-auto"
                  />
                </span>
              </Link>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-lg font-medium text-ink hover:text-brand-dark transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/favoritos"
                className="inline-flex items-center gap-2 text-lg font-medium text-ink hover:text-brand-dark transition-colors py-2"
              >
                <Heart
                  className={cn(
                    "h-4 w-4",
                    favCount > 0 && "fill-red-500 text-red-500"
                  )}
                />
                Favoritos
                {favCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {favCount}
                  </span>
                )}
              </Link>
              <Link
                href="/contacto"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "mt-4 bg-brand text-ink hover:bg-brand-dark hover:text-white"
                )}
              >
                <Phone className="mr-2 h-4 w-4" />
                Contacto
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
}
