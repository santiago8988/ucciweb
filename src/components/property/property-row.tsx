"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Bed, Bath, Maximize, Car, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/property/favorite-button";
import { operationTypeLabel, propertyTypeLabel } from "@/lib/constants";
import { formatCardSurface, formatLocation, PLACEHOLDER_IMAGE } from "@/lib/format";
import type { PropertyCardData } from "@/lib/queries";

export function PropertyRow({
  property,
  index = 0,
}: {
  property: PropertyCardData;
  index?: number;
}) {
  const operationLabel = operationTypeLabel(property.operationType);
  const typeLabel = propertyTypeLabel(property.propertyType);
  const surface = formatCardSurface(property.coveredSurface, property.totalSurface);
  // The first row is the LCP candidate: load it eagerly and don't fade it in.
  const isFirst = index === 0;

  const features = [
    property.rooms != null && property.rooms > 0 && { icon: Home, value: `${property.rooms} amb.` },
    property.bedrooms != null && { icon: Bed, value: `${property.bedrooms} dorm.` },
    property.bathrooms != null && { icon: Bath, value: `${property.bathrooms} baño${property.bathrooms === 1 ? "" : "s"}` },
    property.parkingSpaces != null && property.parkingSpaces > 0 && { icon: Car, value: `${property.parkingSpaces} coch.` },
    surface && { icon: Maximize, value: surface },
  ].filter(Boolean) as { icon: typeof Bed; value: string }[];

  return (
    <motion.div
      initial={index < 2 ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/propiedades/${property.id}`}
        className="group block overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-lg hover:border-gray-200"
      >
        <article className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative aspect-4/3 sm:aspect-auto sm:w-72 sm:shrink-0 overflow-hidden">
            <Image
              src={property.imageUrl ?? PLACEHOLDER_IMAGE}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 288px"
              loading={isFirst ? "eager" : "lazy"}
              fetchPriority={isFirst ? "high" : "auto"}
            />

            {/* Operation badge — top left */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-white text-ink text-[11px] font-semibold shadow-md uppercase tracking-[0.08em] px-2.5">
                {operationLabel}
              </Badge>
              {property.featured && (
                <Badge className="bg-[#ED1B24] text-white text-[11px] font-semibold shadow-md uppercase tracking-[0.08em] px-2.5">
                  Destacada
                </Badge>
              )}
            </div>

            {/* Favorite — bottom right over image */}
            <div className="absolute bottom-3 right-3">
              <FavoriteButton propertyId={property.id} variant="card" />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-5 sm:p-6 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xl font-bold text-ink sm:text-2xl">{property.priceText}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-ink/70">
                  {typeLabel}
                </p>
              </div>
            </div>

            <h3 className="mt-3 text-base font-medium text-ink line-clamp-1 group-hover:text-brand-dark transition-colors sm:text-lg">
              {property.title}
            </h3>

            {property.excerpt && (
              <p className="mt-1 text-sm text-ink/70 line-clamp-2">
                {property.excerpt}
              </p>
            )}

            <p className="mt-3 flex items-center gap-1 text-sm text-ink/70">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {formatLocation(property.neighborhood, property.locality)}
              </span>
            </p>

            {features.length > 0 && (
              <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink/70">
                {features.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5">
                    <f.icon className="h-4 w-4 text-ink/50" />
                    <span>{f.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
