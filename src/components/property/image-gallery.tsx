"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; imageUrl: string; isMain: boolean };

// Arrows: always visible on touch screens (no hover); on hover-capable devices
// they appear on hover or keyboard focus.
const ARROW_VISIBILITY =
  "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100";

const SWIPE_THRESHOLD = 40;

const MAIN_SIZES = "(max-width: 1024px) 100vw, 66vw";
const BACKDROP_SIZES = "64px";
const LIGHTBOX_SIZES = "(min-width: 1152px) 1152px, 100vw";

// Fetches a photo in the background with the same srcset/sizes the gallery
// renders, so the browser picks the same variant and caches it. The first
// request for each variant is also what makes the server resize it (~0.6–1.3 s
// cold), so warming the neighbors hides that wait when moving between photos.
function warmImage(src: string, sizes: string) {
  const { props } = getImageProps({ src, alt: "", fill: true, sizes });
  const img = new window.Image();
  img.decoding = "async";
  if (props.sizes) img.sizes = props.sizes;
  if (props.srcSet) img.srcset = props.srcSet;
  img.src = props.src;
}

// Horizontal swipe with pointer events (touch, pen or mouse drag). The element
// using it should allow vertical panning only (touch-action: pan-y) so the page
// still scrolls. `consumeSwipe()` tells a click handler to ignore the click
// that ends a swipe.
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
      swiped.current = false;
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
      swiped.current = true;
      if (dx < 0) onSwipeLeft();
      else onSwipeRight();
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };

  const consumeSwipe = () => {
    const was = swiped.current;
    swiped.current = false;
    return was;
  };

  return { handlers, consumeSwipe };
}

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = images.length;

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const openAt = (i: number) => {
    setCurrentIndex(i);
    setLightboxOpen(true);
  };

  const mainSwipe = useSwipe(next, prev);
  const lightboxSwipe = useSwipe(next, prev);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, next, prev]);

  // Warm the previous and next photos once the current one has had a head start.
  useEffect(() => {
    if (total < 2) return;
    const neighbors = new Set([(currentIndex + 1) % total, (currentIndex - 1 + total) % total]);
    const id = window.setTimeout(() => {
      for (const i of neighbors) {
        const src = images[i].imageUrl;
        if (lightboxOpen) {
          warmImage(src, LIGHTBOX_SIZES);
        } else {
          warmImage(src, MAIN_SIZES);
          warmImage(src, BACKDROP_SIZES);
        }
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [currentIndex, lightboxOpen, images, total]);

  if (total === 0) {
    return (
      <div className="aspect-[16/9] rounded-2xl bg-stone/50 flex items-center justify-center">
        <p className="text-ink/40">Sin imágenes disponibles</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Image — swipe to change photo, tap/click (or Enter) to enlarge */}
      <div
        className="relative aspect-[16/9] overflow-hidden rounded-2xl group bg-ink touch-pan-y select-none"
        {...(total > 1 ? mainSwipe.handlers : {})}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {/* Blurred backdrop — fills the frame so verticals don't leave empty bars.
                A 64px thumbnail is enough once blurred; being upscaled it doesn't
                compete as the LCP element with the real photo below. */}
            <Image
              src={images[currentIndex].imageUrl}
              alt=""
              fill
              aria-hidden
              loading="eager"
              className="object-cover scale-110 blur-2xl opacity-60"
              sizes={BACKDROP_SIZES}
            />
            {/* Actual image — full photo, no crop */}
            <Image
              src={images[currentIndex].imageUrl}
              alt={`Imagen ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes={MAIN_SIZES}
              loading="eager"
              fetchPriority="high"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* Full-area button: keyboard/screen-reader access to the lightbox */}
        <button
          type="button"
          aria-label={`Ampliar imagen ${currentIndex + 1} de ${total}`}
          className="absolute inset-0 z-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
          onClick={() => {
            if (mainSwipe.consumeSwipe()) return;
            openAt(currentIndex);
          }}
        />

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Imagen anterior"
              className={cn(
                "absolute left-3 top-1/2 z-10 -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-white/90 text-ink shadow-lg transition-opacity hover:bg-white",
                ARROW_VISIBILITY
              )}
              onClick={prev}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              className={cn(
                "absolute right-3 top-1/2 z-10 -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-white/90 text-ink shadow-lg transition-opacity hover:bg-white",
                ARROW_VISIBILITY
              )}
              onClick={next}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div
          className="pointer-events-none absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-ink/70 backdrop-blur px-3 py-1.5 text-xs font-medium text-white"
          aria-live="polite"
        >
          <Expand className="h-3.5 w-3.5" />
          {currentIndex + 1} / {total}
        </div>
      </div>

      {/* Thumbnails — click opens lightbox at that index */}
      {total > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => openAt(i)}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                i === currentIndex
                  ? "ring-2 ring-brand ring-offset-2"
                  : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <Image src={img.imageUrl} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-6xl sm:max-w-6xl p-0 bg-ink border-none gap-0 overflow-hidden rounded-2xl"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Galería de imágenes</DialogTitle>

          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-20 grid place-items-center h-10 w-10 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative aspect-[16/10] w-full touch-pan-y select-none"
            {...(total > 1 ? lightboxSwipe.handlers : {})}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[currentIndex].imageUrl}
                  alt={`Imagen ${currentIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes={LIGHTBOX_SIZES}
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>

            {total > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-sm text-white">
              {currentIndex + 1} / {total}
            </div>
          </div>

          {/* Thumbnail strip inside lightbox */}
          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-black/60">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  aria-current={i === currentIndex ? "true" : undefined}
                  className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md transition-all ${
                    i === currentIndex
                      ? "ring-2 ring-brand opacity-100"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image src={img.imageUrl} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
