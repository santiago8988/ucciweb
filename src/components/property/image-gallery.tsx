"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type GalleryImage = { id: string; imageUrl: string; isMain: boolean };

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

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, next, prev]);

  if (total === 0) {
    return (
      <div className="aspect-[16/9] rounded-2xl bg-stone/50 flex items-center justify-center">
        <p className="text-ink/40">Sin imágenes disponibles</p>
      </div>
    );
  }

  return (
    <>
      {/* Main Image */}
      <div
        className="relative aspect-[16/9] overflow-hidden rounded-2xl cursor-zoom-in group bg-ink"
        onClick={() => openAt(currentIndex)}
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
            <Image
              src={images[currentIndex].imageUrl}
              alt={`Imagen ${currentIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
              fetchPriority="high"
            />
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-white/90 text-ink shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Siguiente"
              className="absolute right-4 top-1/2 -translate-y-1/2 grid place-items-center h-11 w-11 rounded-full bg-white/90 text-ink shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-ink/70 backdrop-blur px-3 py-1.5 text-xs font-medium text-white">
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

          <div className="relative aspect-[16/10] w-full">
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
                  sizes="100vw"
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
