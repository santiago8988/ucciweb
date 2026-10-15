import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, MessageCircle } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { getProperties, getLocalities, getNeighborhoods, getRentalCount, type PropertyFilters as DBFilters, type PropertyOrderBy } from "@/lib/queries";
import { PropertyRow } from "@/components/property/property-row";
import { PropertyFilters } from "@/components/property/property-filters";
import { MobileFilters } from "@/components/property/mobile-filters";
import { SortSelect } from "@/components/property/sort-select";
import { Pagination } from "@/components/property/pagination";
import { ListingUrlRecorder } from "@/components/property/last-listing";
import type { PropertyType, OperationType, Currency } from "@/generated/prisma";
import {
  PROPERTY_TYPES,
  OPERATION_TYPES,
  RENTALS_WHATSAPP,
  SALES_WHATSAPP,
  OPERATION_TYPE_PHRASES,
  buildWhatsAppUrl,
  propertyTypeLabel,
} from "@/lib/constants";
import { formatPrice } from "@/lib/format";

// Every filter combination is its own URL with the same content: they all
// point to /propiedades as canonical and aren't indexed (links still followed).
export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const params = await searchParams;
  const filtered = Object.keys(params).length > 0;
  return {
    title: "Propiedades en venta y alquiler en Mar del Plata",
    description:
      "Explorá todas las propiedades disponibles en UCCI Propiedades. Casas, departamentos, terrenos y más en Mar del Plata.",
    alternates: { canonical: "/propiedades" },
    ...(filtered && { robots: { index: false, follow: true } }),
  };
}

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

// Compile-time check that the shared lists match the Prisma enums.
PROPERTY_TYPES satisfies readonly PropertyType[];
OPERATION_TYPES satisfies readonly OperationType[];

function parseText(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  const values = raw
    .split(",")
    .map((s) => s.trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 20);
  return values.length > 0 ? values : undefined;
}

// Accept ranges typed in either order.
function orderedRange(a?: number, b?: number): [number | undefined, number | undefined] {
  return a != null && b != null && a > b ? [b, a] : [a, b];
}

// Human summary of the search for the "avisame" WhatsApp message.
function describeSearch(f: DBFilters): string {
  const parts: string[] = [];
  const types = f.propertyTypes?.map((t) => propertyTypeLabel(t).toLowerCase());
  parts.push(types?.length ? types.join(" o ") : "una propiedad");
  const op = f.operationTypes?.[0];
  if (op) parts.push(OPERATION_TYPE_PHRASES[op]);
  const places = [...(f.neighborhoods ?? []), ...(f.localities ?? [])];
  if (places.length) parts.push(`en ${places.join(" o ")}`);
  if (f.minRooms) parts.push(`de ${f.minRooms}+ ambientes`);
  if (f.currency && (f.minPrice != null || f.maxPrice != null)) {
    if (f.minPrice != null) parts.push(`desde ${formatPrice(f.minPrice, f.currency)}`);
    if (f.maxPrice != null) parts.push(`hasta ${formatPrice(f.maxPrice, f.currency)}`);
  }
  if (f.q) parts.push(`con "${f.q}"`);
  return parts.join(" ");
}

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

  const [minPrice, maxPrice] = orderedRange(parseInt32(first(params.pmin)), parseInt32(first(params.pmax)));
  const [minAge, maxAge] = orderedRange(parseInt32(first(params.antmin)), parseInt32(first(params.antmax)));
  const [minCovered, maxCovered] = orderedRange(parseInt32(first(params.cmin)), parseInt32(first(params.cmax)));
  const [minTotal, maxTotal] = orderedRange(parseInt32(first(params.tmin)), parseInt32(first(params.tmax)));

  const filters: DBFilters = {
    operationTypes: parseList(first(params.op), OPERATION_TYPES),
    propertyTypes: parseList(first(params.tipo), PROPERTY_TYPES),
    localities: parseText(first(params.loc)),
    neighborhoods: parseText(first(params.bar)),
    currency,
    // ARS and USD amounts aren't comparable: a price range needs a currency.
    minPrice: currency ? minPrice : undefined,
    maxPrice: currency ? maxPrice : undefined,
    minRooms: parseInt32(first(params.amb)),
    minBedrooms: parseInt32(first(params.dorm)),
    minAge,
    maxAge,
    minCoveredSurface: minCovered,
    maxCoveredSurface: maxCovered,
    minTotalSurface: minTotal,
    maxTotalSurface: maxTotal,
    q: first(params.q),
    includeSold: first(params.vendidas) === "1",
    orderBy,
    page: parseInt32(first(params.page)) || 1,
  };

  const wantsRentals = filters.operationTypes?.includes("alquiler") ?? false;
  const hasFilters = Object.keys(params).some((k) => k !== "sort" && k !== "page");

  const [result, localities, neighborhoods, rentalCount] = await Promise.all([
    getProperties(filters),
    getLocalities(),
    getNeighborhoods(),
    getRentalCount(),
  ]);
  const noRentalsPublished = wantsRentals && rentalCount === 0;

  return (
    <div className="pt-20 bg-gray-50/60 min-h-screen">
      <div className="content-wrap py-6">
        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-ink/10 bg-white p-4 pr-3 scrollbar-thin">
              <Suspense>
                <PropertyFilters localities={localities} neighborhoods={neighborhoods} />
              </Suspense>
            </div>
          </aside>

          <section className="flex-1 min-w-0" aria-labelledby="listado-titulo">
            <h1 id="listado-titulo" className="sr-only">
              Propiedades en venta y alquiler
            </h1>
            <Suspense>
              <ListingUrlRecorder />
            </Suspense>
            {/* Top bar — wraps on narrow phones instead of overflowing */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Suspense>
                  <MobileFilters localities={localities} neighborhoods={neighborhoods} total={result.total} />
                </Suspense>
                <p className="text-sm text-ink/70 whitespace-nowrap">
                  <span className="font-semibold text-ink">{result.total}</span>{" "}
                  {result.total === 1 ? "resultado" : "resultados"}
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
                <p className="mt-2 text-sm text-ink/70 max-w-sm mx-auto">
                  {noRentalsPublished
                    ? "Por ahora no tenemos alquileres publicados en la web, pero nuestro equipo de alquileres puede ayudarte con opciones disponibles."
                    : "Probá con otros filtros, o contanos qué buscás y te avisamos cuando ingrese algo así."}
                </p>
                <a
                  href={buildWhatsAppUrl(
                    wantsRentals ? RENTALS_WHATSAPP : SALES_WHATSAPP,
                    noRentalsPublished
                      ? "Hola UCCI Propiedades, estoy buscando una propiedad en alquiler."
                      : `Hola UCCI Propiedades, busco ${describeSearch(filters)}. ¿Me avisan si ingresa algo así?`
                  )}
                  data-track="whatsapp"
                  data-property-code="sin-resultados"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants(),
                    "mt-6 bg-brand text-black hover:bg-brand-dark hover:text-white"
                  )}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {noRentalsPublished ? "Consultar alquileres por WhatsApp" : "Avisame por WhatsApp"}
                </a>
                <div className="mt-4">
                  <Link
                    href="/propiedades"
                    className="text-sm font-medium text-ink underline underline-offset-4 hover:text-brand-dark"
                  >
                    {hasFilters ? "Limpiar filtros" : "Ver todas las propiedades"}
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
