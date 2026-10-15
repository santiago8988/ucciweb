"use client";

import { useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PropertyFilters } from "@/components/property/property-filters";

export function MobileFilters({
  localities,
  neighborhoods,
  total,
}: {
  localities: string[];
  neighborhoods: string[];
  /** Results for the current filters (updates when the listing re-renders). */
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const label = pending
    ? "Actualizando…"
    : total === 0
      ? "Sin resultados · Cerrar"
      : `Ver ${total} ${total === 1 ? "propiedad" : "propiedades"}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/5 transition-colors lg:hidden">
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col gap-0 bg-white p-0">
        <SheetTitle className="px-5 pt-5 pb-2 text-sm font-bold uppercase tracking-widest text-ink">
          Filtros
        </SheetTitle>
        <div className="flex-1 overflow-y-auto px-5">
          <PropertyFilters
            localities={localities}
            neighborhoods={neighborhoods}
            showTitle={false}
            onPendingChange={setPending}
          />
        </div>
        {/* Results are applied live behind the sheet; this shows how many match. */}
        <div className="border-t border-ink/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-base font-semibold text-black transition-colors hover:bg-brand-dark hover:text-white"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            <span aria-live="polite">{label}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
