import { Suspense } from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getProperties, getLocalities } from "@/lib/queries";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyFilters } from "@/components/property/property-filters";
import { Pagination } from "@/components/property/pagination";
import { PropertyType, OperationType } from "@/generated/prisma";

export const metadata: Metadata = {
  title: "Propiedades",
  description:
    "Explorá todas las propiedades disponibles en UCCI Propiedades. Casas, departamentos, terrenos y más.",
};

export const revalidate = 60;

type SearchParams = Promise<{
  operacion?: string;
  tipo?: string;
  localidad?: string;
  page?: string;
}>;

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const filters = {
    operationType: params.operacion as OperationType | undefined,
    propertyType: params.tipo as PropertyType | undefined,
    locality: params.localidad,
    page: params.page ? parseInt(params.page) : 1,
  };

  const [result, localities] = await Promise.all([
    getProperties(filters),
    getLocalities(),
  ]);

  return (
    <div className="pt-20">
      {/* Page header — clean like Compass */}
      <section className="bg-white border-b py-10">
        <div className="container mx-auto px-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-dark mb-2">
            Catálogo
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="text-3xl font-light text-gray-900 sm:text-4xl">
              Propiedades disponibles
            </h1>
            <p className="text-sm text-gray-400">
              {result.total} resultado{result.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Suspense>
          <PropertyFilters localities={localities} />
        </Suspense>

        {result.properties.length > 0 ? (
          <>
            <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {result.properties.map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))}
            </div>
            <Suspense>
              <Pagination currentPage={result.currentPage} totalPages={result.totalPages} />
            </Suspense>
          </>
        ) : (
          <div className="mt-20 mb-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Search className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-xl font-medium text-gray-700">No se encontraron propiedades</p>
            <p className="mt-2 text-sm text-gray-400 max-w-sm mx-auto">
              Intentá con otros filtros de búsqueda o explorá todas las propiedades disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
