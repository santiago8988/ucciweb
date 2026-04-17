"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Bed, Bath, Maximize, Car, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/property/favorite-button";
import { OPERATION_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/constants";
import { getMainImage, getPropertyPrice, formatSurface } from "@/lib/format";
import type { Property, PropertyImage } from "@/generated/prisma";

type PropertyWithRelations = Property & {
  images: PropertyImage[];
};

export function PropertyRow({
  property,
  index = 0,
}: {
  property: PropertyWithRelations;
  index?: number;
}) {
  const mainImage = getMainImage(property.images);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- serialized Decimals
  const price = getPropertyPrice(property as any);
  const operationLabel = OPERATION_TYPE_LABELS[property.operationType] || property.operationType;
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType;

  const features = [
    property.rooms != null && property.rooms > 0 && { icon: Home, value: `${property.rooms} amb.` },
    property.bedrooms != null && { icon: Bed, value: `${property.bedrooms} dorm.` },
    property.bathrooms != null && { icon: Bath, value: `${property.bathrooms} baño${property.bathrooms === 1 ? "" : "s"}` },
    property.parkingSpaces != null && property.parkingSpaces > 0 && { icon: Car, value: `${property.parkingSpaces} coch.` },
    property.totalSurface && { icon: Maximize, value: formatSurface(property.totalSurface as never) },
  ].filter(Boolean) as { icon: typeof Bed; value: string }[];

  const locationText = [property.neighborhood, property.locality, property.province]
    .filter(Boolean)
    .join(", ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
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
              src={mainImage}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 288px"
            />

            {/* Operation badge — top left */}
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-brand text-black text-[11px] font-semibold shadow-md uppercase tracking-wider px-2.5">
                {operationLabel}
              </Badge>
              {property.featured && (
                <Badge className="bg-[#ED1B24] text-white text-[11px] font-semibold shadow-md uppercase tracking-wider px-2.5">
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
                <p className="text-xl font-bold text-ink sm:text-2xl">{price}</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-brand-dark">
                  {typeLabel}
                </p>
              </div>
            </div>

            <h3 className="mt-3 text-base font-medium text-ink line-clamp-1 group-hover:text-brand-dark transition-colors sm:text-lg">
              {property.title}
            </h3>

            {property.description && (
              <p className="mt-1 text-sm text-ink/60 line-clamp-2">
                {property.description}
              </p>
            )}

            <p className="mt-3 flex items-center gap-1 text-sm text-ink/50">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{locationText}</span>
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
