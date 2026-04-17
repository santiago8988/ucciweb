"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

type Props = {
  propertyId: string;
  variant?: "card" | "detail";
  className?: string;
};

export function FavoriteButton({
  propertyId,
  variant = "card",
  className,
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(propertyId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(propertyId);
  };

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
        aria-pressed={active}
        className={cn(
          "group/fav grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow-md backdrop-blur-sm transition-all hover:scale-110 active:scale-95",
          className
        )}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-all",
            active
              ? "fill-red-500 text-red-500"
              : "text-ink/60 group-hover/fav:text-red-500"
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-5 text-sm font-medium text-ink transition-all hover:border-red-300 hover:bg-red-50 active:scale-95",
        active && "border-red-300 bg-red-50",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          active ? "fill-red-500 text-red-500" : "text-ink/60"
        )}
      />
      {active ? "Guardada en favoritos" : "Guardar en favoritos"}
    </button>
  );
}
