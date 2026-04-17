"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, MapPin } from "lucide-react";
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
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";

const TABS = [
  { value: "venta", label: "Comprar" },
  { value: "alquiler", label: "Alquilar" },
] as const;

const ALL_TYPES = "todos";

const HERO_TYPE_LABELS: Record<string, string> = {
  [ALL_TYPES]: "Todos los tipos",
  ...PROPERTY_TYPE_LABELS,
};

export function Hero({ propertyCount }: { propertyCount: number }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("venta");
  const [propertyType, setPropertyType] = useState<string>(ALL_TYPES);
  const [locality, setLocality] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set("operacion", activeTab);
    if (propertyType && propertyType !== ALL_TYPES) params.set("tipo", propertyType);
    if (locality) params.set("localidad", locality);
    router.push(`/propiedades?${params.toString()}`);
  };

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-ink">
      {/* Background with parallax-like effect */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1561816646-b5b12a9b92ed?w=1920&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/45 to-ink/85" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand/10 to-transparent" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Main headline — Sotheby's editorial style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="text-center mb-12"
        >
  
        </motion.div>

        {/* Search Card — Compass style with tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mx-auto max-w-3xl"
        >
          {/* Operation Tabs */}
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                type="button"
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* Location input — Zillow style prominent */}
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Ciudad, barrio o dirección..."
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 text-base border-ink/10 focus:border-brand-dark"
                />
              </div>

              <Select
                value={propertyType}
                onValueChange={(v) => setPropertyType(v ?? ALL_TYPES)}
              >
                <SelectTrigger className="h-12 md:w-52 border-ink/10">
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
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                  <SelectItem value="local_comercial">Local Comercial</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="cochera">Cochera</SelectItem>
                  <SelectItem value="galpon">Galpón</SelectItem>
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
          </div>
        </motion.div>

        {/* Trust stats — Knight Frank style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mx-auto mt-16 flex max-w-2xl items-center justify-center gap-8 md:gap-16"
        >
          {[
            { value: "+60", label: "Años de experiencia" },
            { value: "100%", label: "Propiedades verificadas" },
            { value: "24hs", label: "Respuesta garantizada" },
          
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-semibold text-white md:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs  text-white uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
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
