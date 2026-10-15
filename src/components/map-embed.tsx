"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Google Maps iframe facade. The embed pulls ~500 KB of third-party JS that,
// loaded eagerly, competes with the page's first render. We only mount it once
// the page has finished loading AND the map is near the viewport (or on click).
export function MapEmbed({
  query,
  zoom = 15,
  title,
  label,
  className,
}: {
  /** Address or "lat,lng" passed to Google Maps. */
  query: string;
  zoom?: number;
  title: string;
  /** Short text shown on the placeholder (e.g. the address). */
  label?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) return;
    let observer: IntersectionObserver | undefined;
    const observe = () => {
      if (!ref.current) return;
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setShow(true);
            observer?.disconnect();
          }
        },
        { rootMargin: "200px" }
      );
      observer.observe(ref.current);
    };
    if (document.readyState === "complete") observe();
    else window.addEventListener("load", observe, { once: true });
    return () => {
      window.removeEventListener("load", observe);
      observer?.disconnect();
    };
  }, [show]);

  const encoded = encodeURIComponent(query);
  const embedUrl = `https://maps.google.com/maps?q=${encoded}&z=${zoom}&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-stone/40", className)}>
      {show ? (
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
          <MapPin className="h-7 w-7 text-ink/60" aria-hidden />
          {label && <p className="max-w-[16rem] text-sm text-ink/80">{label}</p>}
          <button
            type="button"
            onClick={() => setShow(true)}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-ink/5"
          >
            Ver mapa
          </button>
        </div>
      )}
      <a
        href={openUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-ink shadow-sm hover:bg-white"
      >
        Abrir en Google Maps
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </div>
  );
}
