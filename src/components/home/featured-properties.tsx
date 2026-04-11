"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { PropertyCard } from "@/components/property/property-card";
import { cn } from "@/lib/utils";
import type { Property, PropertyImage, PropertyVideo, Agent } from "@prisma/client";

type PropertyWithRelations = Property & {
  images: PropertyImage[];
  videos: PropertyVideo[];
  agent: Agent | null;
};

export function FeaturedProperties({ properties }: { properties: PropertyWithRelations[] }) {
  if (properties.length === 0) return null;

  return (
    <section className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-4">
        {/* Section header — editorial style like Sotheby's */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-dark mb-2">
                Selección exclusiva
              </p>
              <h2 className="text-3xl font-light text-gray-900 sm:text-4xl lg:text-5xl">
                Propiedades destacadas
              </h2>
            </div>
            <Link
              href="/propiedades"
              className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-dark transition-colors group"
            >
              Ver todas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-brand-dark/40 to-transparent max-w-xs" />
        </motion.div>

        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property, i) => (
            <PropertyCard key={property.id} property={property} index={i} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-10 text-center md:hidden">
          <Link
            href="/propiedades"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "group")}
          >
            Ver todas las propiedades
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
