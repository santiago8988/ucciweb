"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

// The listing remembers its URL (with filters/page) for the session so the
// property page can link back to the same search instead of a bare /propiedades.
const KEY = "ucci:last-listing";
const DEFAULT = "/propiedades";

// Falls back to the referrer: if the visitor clicked a card before the listing
// finished hydrating, the browser did a full navigation and nothing was stored.
function fromReferrer(): string | null {
  try {
    const ref = new URL(document.referrer);
    if (ref.origin !== window.location.origin || ref.pathname !== DEFAULT) return null;
    return `${ref.pathname}${ref.search}`;
  } catch {
    return null;
  }
}

function read(): string {
  try {
    const value = window.sessionStorage.getItem(KEY);
    if (value && value.startsWith(DEFAULT)) return value;
  } catch {
    // Storage unavailable: try the referrer.
  }
  return fromReferrer() ?? DEFAULT;
}

/** Mounted on /propiedades: records the current listing URL. */
export function ListingUrlRecorder() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  useEffect(() => {
    try {
      window.sessionStorage.setItem(KEY, qs ? `${pathname}?${qs}` : pathname);
    } catch {
      // Storage unavailable (private mode): the back link falls back to /propiedades.
    }
  }, [pathname, qs]);

  return null;
}

const subscribe = () => () => {};

/** "Volver a propiedades" that returns to the last search, filters included. */
export function BackToListing({ className }: { className?: string }) {
  const href = useSyncExternalStore(subscribe, read, () => DEFAULT);
  const hasFilters = href !== DEFAULT;

  return (
    <Link href={href} className={cn(buttonVariants({ variant: "ghost" }), className)}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {hasFilters ? "Volver a los resultados" : "Volver a propiedades"}
    </Link>
  );
}
