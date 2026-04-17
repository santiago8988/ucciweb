import { Suspense } from "react";
import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getProperties, getLocalities, getNeighborhoods, type PropertyFilters as DBFilters, type PropertyOrderBy } from "@/lib/queries";
import { PropertyRow } from "@/components/property/property-row";
import { PropertyFilters } from "@/components/property/property-filters";
import { MobileFilters } from "@/components/property/mobile-filters";
import { SortSelect } from "@/components/property/sort-select";
import { Pagination } from "@/components/property/pagination";
import { PropertyType, OperationType, Currency } from "@/generated/prisma";

export const metadata: Metadata = {
  title: "Propiedades",
  description:
    "Explorá todas las propiedades disponibles en UCCI Propiedades. Casas, departamentos, terrenos y más.",
};

export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseList<T extends string>(
  raw: string | undefined,
  allowed: readonly T[]
): T[] | undefined {
  if (!raw) return undefined;
  const values = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
  return values.length > 0 ? values : undefined;
}

function parseInt32(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

const PROPERTY_TYPES = [
  "casa",
  "departamento",
  "terreno",
  "local_comercial",
  "oficina",
  "cochera",
  "galpon",
] as const satisfies readonly PropertyType[];

const OPERATION_TYPES = [
  "venta",
  "alquiler",
  "venta_alquiler",
] as const satisfies readonly OperationType[];

const SORT_VALUES: PropertyOrderBy[] = ["recent", "price_asc", "price_desc"];

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const currencyRaw = first(params.mon);
  const currency: Currency | undefined =
    currencyRaw === "USD" || currencyRaw === "ARS" ? currencyRaw : undefined;

  const sortRaw = first(params.sort);
  const orderBy: PropertyOrderBy | undefined = SORT_VALUES.includes(
    sortRaw as PropertyOrderBy
  )
    ? (sortRaw as PropertyOrderBy)
    : undefined;

  const filters: DBFilters = {
    operationTypes: parseList(first(params.op), OPERATION_TYPES),
    propertyTypes: parseList(first(params.tipo), PROPERTY_TYPES),
    localities: first(params.loc)
      ? first(params.loc)!.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    neighborhoods: first(params.bar)
      ? first(params.bar)!.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    currency,
    minPrice: parseInt32(first(params.pmin)),
    maxPrice: parseInt32(first(params.pmax)),
    minRooms: parseInt32(first(params.amb)),
    minBedrooms: parseInt32(first(params.dorm)),
    minAge: parseInt32(first(params.antmin)),
    maxAge: parseInt32(first(params.antmax)),
    minCoveredSurface: parseInt32(first(params.cmin)),
    maxCoveredSurface: parseInt32(first(params.cmax)),
    minTotalSurface: parseInt32(first(params.tmin)),
    maxTotalSurface: parseInt32(first(params.tmax)),
    q: first(params.q),
    orderBy,
    page: parseInt32(first(params.page)) || 1,
  };

  const [result, localities, neighborhoods] = await Promise.all([
    getProperties(filters),
    getLocalities(),
    getNeighborhoods(),
  ]);

  return (
    <div className="pt-20 bg-gray-50/60 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-ink/10 bg-white p-4 pr-3 scrollbar-thin">
              <Suspense>
                <PropertyFilters localities={localities} neighborhoods={neighborhoods} />
              </Suspense>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {/* Top bar */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Suspense>
                  <MobileFilters localities={localities} neighborhoods={neighborhoods} />
                </Suspense>
                <p className="text-sm text-ink/70">
                  <span className="font-semibold text-ink">{result.total}</span>{" "}
                  Resultados de búsqueda
                </p>
              </div>
              <Suspense>
                <SortSelect />
              </Suspense>
            </div>

            {result.properties.length > 0 ? (
              <>
                <div className="flex flex-col gap-4">
                  {result.properties.map((property, i) => (
                    <PropertyRow key={property.id} property={property} index={i} />
                  ))}
                </div>
                <Suspense>
                  <Pagination currentPage={result.currentPage} totalPages={result.totalPages} />
                </Suspense>
              </>
            ) : (
              <div className="mt-16 mb-16 rounded-xl border border-ink/10 bg-white p-12 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Search className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-xl font-medium text-ink">No se encontraron propiedades</p>
                <p className="mt-2 text-sm text-ink/50 max-w-sm mx-auto">
                  Intentá con otros filtros de búsqueda o explorá todas las propiedades disponibles.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
