"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  RENTALS_WHATSAPP,
  buildWhatsAppUrl,
} from "@/lib/constants";
import heroImage from "@/assets/hero-playa-grande.jpg";
import heroLogo from "@/assets/logo-ucci-hero.png";

const TABS = [
  { value: "venta", label: "Comprar" },
  { value: "alquiler", label: "Alquilar" },
] as const;

const ALL_TYPES = "todos";

const HERO_TYPE_LABELS: Record<string, string> = {
  [ALL_TYPES]: "Todos los tipos",
  ...PROPERTY_TYPE_LABELS,
};

export function Hero({ rentalCount }: { rentalCount: number }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("venta");
  const [propertyType, setPropertyType] = useState<string>(ALL_TYPES);
  const [query, setQuery] = useState("");

  // No rentals published yet: send renters to the rentals team instead of an empty list.
  const rentalsViaWhatsApp = activeTab === "alquiler" && rentalCount === 0;

  const handleSearch = () => {
    if (rentalsViaWhatsApp) return;
    // Param names must match what /propiedades reads (op, tipo, q).
    const params = new URLSearchParams();
    params.set("op", activeTab);
    if (propertyType && propertyType !== ALL_TYPES) params.set("tipo", propertyType);
    const q = query.trim();
    if (q) params.set("q", q);
    router.push(`/propiedades?${params.toString()}`);
  };

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-ink">
      <Image
        src={heroImage}
        alt=""
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        className="object-cover scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.4)_100%)]" />

      <div className="relative z-10 content-wrap pt-24">
        <div className="text-center mb-10">
          {/* The logo is the visible heading; the hidden text keeps the page's
              topic in the H1 for search engines and screen readers. */}
          <h1>
            <Image
              src={heroLogo}
              alt="UCCI Propiedades"
              sizes="(min-width: 640px) 448px, 288px"
              className="mx-auto h-auto w-72 drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:w-md"
              preload
            />
            <span className="sr-only"> · Propiedades en Mar del Plata</span>
          </h1>
          <p className="mt-5 text-base text-white/80 sm:text-lg">
            Inmobiliaria familiar en Playa Grande desde 1969
          </p>
        </div>

        {/* Search Card — Compass style with tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto max-w-3xl"
        >
          {/* Operation Tabs */}
          <div className="flex" role="group" aria-label="Operación">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                type="button"
                aria-pressed={activeTab === tab.value}
                className={cn(
                  "px-8 py-3 text-sm font-semibold tracking-wide uppercase transition-all rounded-t-xl",
                  activeTab === tab.value
                    ? "bg-white text-ink"
                    : "bg-white/15 text-white/80 hover:bg-white/25 active:bg-white/30"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Fields */}
          <div className="rounded-b-2xl rounded-tr-2xl bg-white p-5 shadow-2xl md:p-7">
            {rentalsViaWhatsApp ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-ink/80 md:text-base">
                  Nuestros alquileres se gestionan directamente con el equipo. Escribinos
                  y te contamos qué hay disponible.
                </p>
                <a
                  href={buildWhatsAppUrl(
                    RENTALS_WHATSAPP,
                    "Hola UCCI Propiedades, estoy buscando una propiedad en alquiler."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants(),
                    "h-12 shrink-0 bg-brand px-6 text-base font-semibold text-black hover:bg-brand-dark hover:text-white"
                  )}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Consultar alquileres
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Barrio, dirección o característica..."
                    aria-label="Buscar por barrio, dirección o característica"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    maxLength={80}
                    className="pl-10 h-12 text-base border-ink/10 focus:border-brand-dark"
                  />
                </div>

                <Select
                  value={propertyType}
                  onValueChange={(v) => setPropertyType(v ?? ALL_TYPES)}
                >
                  <SelectTrigger className="h-12 md:w-52 border-ink/10" aria-label="Tipo de propiedad">
                    <SelectValue placeholder="Tipo de propiedad">
                      {(value) =>
                        typeof value === "string" && HERO_TYPE_LABELS[value]
                          ? HERO_TYPE_LABELS[value]
                          : "Tipo de propiedad"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_TYPES}>Todos los tipos</SelectItem>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {PROPERTY_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleSearch}
                  className="bg-brand text-black hover:bg-brand-dark hover:text-white active:scale-95 h-12 px-8 text-base font-semibold"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator — desktop only (a mouse metaphor makes no sense on touch) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="h-10 w-6 rounded-full border-2 border-white/30 flex items-start justify-center pt-2"
        >
          <div className="h-2 w-1 rounded-full bg-white/60" />
        </motion.div>
      </motion.div>
    </section>
  );
}
