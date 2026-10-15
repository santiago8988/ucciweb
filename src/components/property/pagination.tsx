"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

// First, last and the current page ± 1, with gaps in between: the row stays
// short on phones no matter how many pages there are.
function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  for (const p of sorted) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && p - prev > 1) out.push("gap");
    out.push(p);
  }
  return out;
}

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  // Real links (not router.push) so crawlers can follow the pagination.
  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) params.delete("page");
    else params.set("page", page.toString());
    const qs = params.toString();
    return qs ? `/propiedades?${qs}` : "/propiedades";
  };

  const arrow = (page: number, label: string, icon: React.ReactNode, disabled: boolean) =>
    disabled ? (
      <span
        aria-hidden
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "pointer-events-none opacity-40")}
      >
        {icon}
      </span>
    ) : (
      <Link href={hrefFor(page)} aria-label={label} className={buttonVariants({ variant: "outline", size: "icon" })}>
        {icon}
      </Link>
    );

  return (
    <nav aria-label="Paginación" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {arrow(currentPage - 1, "Página anterior", <ChevronLeft className="h-4 w-4" />, currentPage <= 1)}
      {pageWindow(currentPage, totalPages).map((page, i) =>
        page === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-ink/50" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={page}
            href={hrefFor(page)}
            aria-label={`Página ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: page === currentPage ? "default" : "outline", size: "icon" }),
              page === currentPage && "bg-brand text-black hover:bg-brand-dark hover:text-white"
            )}
          >
            {page}
          </Link>
        )
      )}
      {arrow(currentPage + 1, "Página siguiente", <ChevronRight className="h-4 w-4" />, currentPage >= totalPages)}
    </nav>
  );
}
