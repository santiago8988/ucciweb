"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight, Trash2 } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { PropertyCard } from "@/components/property/property-card";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { fetchFavoriteProperties } from "./actions";
import type { Property, PropertyImage, PropertyVideo, Agent } from "@/generated/prisma";

type PropertyWithRelations = Property & {
  images: PropertyImage[];
  videos: PropertyVideo[];
  agent: Agent | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; properties: PropertyWithRelations[] };

export default function FavoritosPage() {
  const { favorites, clearFavorites } = useFavorites();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    fetchFavoriteProperties([...favorites]).then((data) => {
      if (cancelled) return;
      const byId = new Map(
        (data as PropertyWithRelations[]).map((p) => [p.id, p])
      );
      const ordered = favorites
        .map((id) => byId.get(id))
        .filter((p): p is PropertyWithRelations => Boolean(p));
      setState({ status: "ready", properties: ordered });
    });

    return () => {
      cancelled = true;
    };
  }, [favorites]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pt-36 pb-20 md:pt-44 md:pb-24">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-brand/10 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand mb-4">
            Mis favoritos
          </p>
          <h1 className="text-4xl font-light text-white sm:text-5xl lg:text-6xl">
            Propiedades guardadas
          </h1>
          <p className="mt-5 max-w-xl text-lg font-light text-white/70">
            Las propiedades que marcás con el corazón quedan guardadas en este
            navegador. Volvé cuando quieras a comparar tus favoritas.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {state.status !== "ready" ? (
          <div className="py-24 text-center text-ink/40">Cargando tus favoritos…</div>
        ) : state.properties.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-brand-soft">
              <Heart className="h-7 w-7 text-brand-dark" />
            </div>
            <p className="text-xl font-medium text-ink">
              Todavía no guardaste ninguna propiedad
            </p>
            <p className="mt-2 mx-auto max-w-sm text-sm text-ink/50">
              Tocá el corazón en cualquier propiedad para sumarla a tu lista de
              favoritos.
            </p>
            <Link
              href="/propiedades"
              className={cn(
                buttonVariants(),
                "mt-8 bg-brand text-black hover:bg-brand-dark hover:text-white"
              )}
            >
              Explorar propiedades
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-end justify-between gap-4">
              <p className="text-sm text-ink/50">
                {state.properties.length} propiedad
                {state.properties.length !== 1 && "es"} guardada
                {state.properties.length !== 1 && "s"}
              </p>
              <button
                type="button"
                onClick={clearFavorites}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition-colors hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
                Vaciar lista
              </button>
            </div>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {state.properties.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
