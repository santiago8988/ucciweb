"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Bed, Bath, Maximize, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/property/favorite-button";
import { operationTypeLabel, propertyTypeLabel } from "@/lib/constants";
import { formatCardSurface, formatLocation, PLACEHOLDER_IMAGE } from "@/lib/format";
import type { PropertyCardData } from "@/lib/queries";

export function PropertyCard({
  property,
  index = 0,
}: {
  property: PropertyCardData;
  index?: number;
}) {
  const operationLabel = operationTypeLabel(property.operationType);
  const typeLabel = propertyTypeLabel(property.propertyType);
  const surface = formatCardSurface(property.coveredSurface, property.totalSurface);

  const features = [
    property.bedrooms != null && { icon: Bed, value: property.bedrooms },
    property.bathrooms != null && { icon: Bath, value: property.bathrooms },
    surface && { icon: Maximize, value: surface },
    property.parkingSpaces != null && property.parkingSpaces > 0 && { icon: Car, value: property.parkingSpaces },
  ].filter(Boolean) as { icon: typeof Bed; value: string | number }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true }}
    >
      <Link href={`/propiedades/${property.id}`} className="group block">
        <article className="overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 group-active:scale-[0.98] group-active:shadow-md">
          {/* Image — 3:2 aspect like Engel & Völkers */}
          <div className="relative aspect-[3/2] overflow-hidden">
            <Image
              src={property.imageUrl ?? PLACEHOLDER_IMAGE}
              alt={property.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges — top left */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <Badge className="bg-white text-ink text-[11px] font-semibold uppercase tracking-[0.08em] shadow-md px-2.5">
                {operationLabel}
              </Badge>
              {property.featured && (
                <Badge className="bg-[#ED1B24] text-white text-[11px] font-semibold uppercase tracking-[0.08em] shadow-md px-2.5">
                  Destacada
                </Badge>
              )}
              {property.status === "reservada" && (
                <Badge className="bg-ink text-white text-[11px] font-semibold uppercase tracking-[0.08em] shadow-md px-2.5">
                  Reservada
                </Badge>
              )}
            </div>

            {/* Type badge + favorite — top right */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs backdrop-blur-sm shadow-sm">
                {typeLabel}
              </Badge>
              <FavoriteButton propertyId={property.id} variant="card" />
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Price — prominent like Zillow */}
            <p className="text-xl font-bold text-gray-900">{property.priceText}</p>

            {/* Features row — compact like Zillow (beds · baths · sqft) */}
            {features.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-sm text-gray-600">
                {features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="mx-1 text-gray-300">·</span>}
                    <f.icon className="h-3.5 w-3.5" />
                    <span>{f.value}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h3 className="mt-2 text-base font-medium text-gray-800 line-clamp-1 group-hover:text-brand-dark transition-colors">
              {property.title}
            </h3>

            {/* Location */}
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {formatLocation(property.neighborhood, property.locality)}
              </span>
            </p>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
