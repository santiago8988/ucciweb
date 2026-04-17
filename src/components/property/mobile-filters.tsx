"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
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
}: {
  localities: string[];
  neighborhoods: string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-ink/5 transition-colors lg:hidden">
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[88vw] max-w-sm overflow-y-auto bg-white p-5"
      >
        <SheetTitle className="text-sm font-bold uppercase tracking-widest text-ink mb-4">
          Filtros
        </SheetTitle>
        <PropertyFilters localities={localities} neighborhoods={neighborhoods} />
      </SheetContent>
    </Sheet>
  );
}
