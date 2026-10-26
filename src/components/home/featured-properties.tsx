"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { PropertyCard } from "@/components/property/property-card";
import { cn } from "@/lib/utils";
import type { PropertyCardData } from "@/lib/queries";

export function FeaturedProperties({ properties }: { properties: PropertyCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Arrows reflect whether there is more to scroll in each direction.
  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);
    return () => observer.disconnect();
  }, [updateArrows, properties.length]);

  // One "page" = the cards that fit (3 on desktop, 2 on tablets). Scrolling to
  // a card's exact start avoids fighting scroll-snap with in-between offsets.
  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    const cards = track ? (Array.from(track.children) as HTMLElement[]) : [];
    if (!track || cards.length < 2) return;
    const origin = cards[0].offsetLeft;
    const step = cards[1].offsetLeft - origin;
    const perPage = Math.max(1, Math.floor((track.clientWidth + step - cards[0].offsetWidth) / step));
    const current = Math.round(track.scrollLeft / step);
    const target = Math.min(cards.length - 1, Math.max(0, current + direction * perPage));
    track.scrollTo({ left: cards[target].offsetLeft - origin, behavior: "smooth" });
  };

  if (properties.length === 0) return null;

  const arrowClass =
    "grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-white text-ink transition-colors hover:border-ink/30 hover:bg-sand-soft disabled:pointer-events-none disabled:opacity-30";

  return (
    <section className="py-24 bg-gray-50/50">
      <div className="content-wrap">
        {/* Section header — editorial style like Sotheby's */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-dark mb-2">
                Selección exclusiva
              </p>
              <h2 className="title-h2">
                Propiedades destacadas
              </h2>
            </div>
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/propiedades"
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-dark transition-colors group"
              >
                Ver todas
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              {(canPrev || canNext) && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => scrollByPage(-1)}
                    disabled={!canPrev}
                    aria-label="Destacadas anteriores"
                    className={arrowClass}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByPage(1)}
                    disabled={!canNext}
                    aria-label="Más destacadas"
                    className={arrowClass}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-brand-dark/40 to-transparent max-w-xs" />
        </motion.div>

        {/* Native horizontal scroll with snap: swipe on phones, arrows on desktop.
            On phones the track bleeds to the screen edges so the next card peeks
            in; the vertical padding leaves room for the cards' hover lift/shadow. */}
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="-mx-6 -my-4 flex snap-x snap-mandatory scroll-px-6 gap-5 overflow-x-auto px-6 py-4 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:gap-7 md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {properties.map((property, i) => (
            <div
              key={property.id}
              className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-1.75rem)/2)] lg:w-[calc((100%-3.5rem)/3)]"
            >
              <PropertyCard property={property} index={Math.min(i, 2)} />
            </div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-10 text-center md:hidden">
          <Link
            href="/propiedades"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "group")}
          >
            Ver todas las propiedades
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
