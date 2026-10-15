import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { ORGANIZATION_ID } from "./env";
import { PropertyType, OperationType, Currency, Prisma } from "@/generated/prisma";
import { getPropertyPrice } from "./format";

export type PropertyOrderBy = "recent" | "price_asc" | "price_desc";

export type PropertyFilters = {
  propertyTypes?: PropertyType[];
  operationTypes?: OperationType[];
  localities?: string[];
  neighborhoods?: string[];
  currency?: Currency;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  minBedrooms?: number;
  minAge?: number;
  maxAge?: number;
  minCoveredSurface?: number;
  maxCoveredSurface?: number;
  minTotalSurface?: number;
  maxTotalSurface?: number;
  q?: string;
  orderBy?: PropertyOrderBy;
  page?: number;
  pageSize?: number;
};

// Upper bounds for user-controlled input (query string / server actions).
export const MAX_QUERY_LENGTH = 80;
export const MAX_PAGE = 500;
export const MAX_FAVORITE_IDS = 50;

const PUBLIC_WHERE = {
  organizationId: ORGANIZATION_ID,
  isPublished: true,
  status: "disponible",
} satisfies Prisma.PropertyWhereInput;

const INCLUDE_PROPERTY = {
  images: { orderBy: { order: "asc" as const } },
  videos: { orderBy: { order: "asc" as const } },
  agent: true,
};

// Only the columns a card needs. Address, coordinates, internal code, agent and
// raw prices never leave the server for listings (hidden prices stay hidden).
const CARD_SELECT = {
  id: true,
  title: true,
  description: true,
  propertyType: true,
  operationType: true,
  salePrice: true,
  rentPrice: true,
  currency: true,
  hideSalePrice: true,
  featured: true,
  rooms: true,
  bedrooms: true,
  bathrooms: true,
  parkingSpaces: true,
  totalSurface: true,
  coveredSurface: true,
  neighborhood: true,
  locality: true,
  images: {
    select: { imageUrl: true },
    orderBy: [{ isMain: "desc" as const }, { order: "asc" as const }],
    take: 1,
  },
} satisfies Prisma.PropertySelect;

type CardRow = Prisma.PropertyGetPayload<{ select: typeof CARD_SELECT }>;

export type PropertyCardData = {
  id: string;
  title: string;
  excerpt: string | null;
  propertyType: string;
  operationType: string;
  priceText: string;
  featured: boolean;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  totalSurface: number | null;
  coveredSurface: number | null;
  neighborhood: string | null;
  locality: string;
  imageUrl: string | null;
};

const toNumber = (d: Prisma.Decimal | null) => (d == null ? null : Number(d));

function toCard(row: CardRow): PropertyCardData {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.description ? row.description.slice(0, 220) : null,
    propertyType: row.propertyType,
    operationType: row.operationType,
    priceText: getPropertyPrice({
      operationType: row.operationType,
      salePrice: toNumber(row.salePrice),
      rentPrice: toNumber(row.rentPrice),
      currency: row.currency,
      hideSalePrice: row.hideSalePrice,
    }),
    featured: row.featured,
    rooms: row.rooms,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parkingSpaces: row.parkingSpaces,
    totalSurface: toNumber(row.totalSurface),
    coveredSurface: toNumber(row.coveredSurface),
    neighborhood: row.neighborhood,
    locality: row.locality,
    imageUrl: row.images[0]?.imageUrl ?? null,
  };
}

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Escape LIKE/ILIKE wildcards so user input is matched literally.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function getFeaturedProperties(): Promise<PropertyCardData[]> {
  const rows = await prisma.property.findMany({
    where: { ...PUBLIC_WHERE, featured: true },
    select: CARD_SELECT,
    take: 6,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toCard);
}

// When a user picks "venta" or "alquiler", properties marked as venta_alquiler
// (both) should also match — they satisfy either operation.
function expandOperations(ops?: OperationType[]): OperationType[] | undefined {
  if (!ops || ops.length === 0) return undefined;
  const set = new Set<OperationType>(ops);
  if (set.has(OperationType.venta) || set.has(OperationType.alquiler)) {
    set.add(OperationType.venta_alquiler);
  }
  return Array.from(set);
}

function priceWhere(
  operations: OperationType[] | undefined,
  minPrice?: number,
  maxPrice?: number
): Prisma.PropertyWhereInput | undefined {
  if (minPrice == null && maxPrice == null) return undefined;
  const range = {
    ...(minPrice != null && { gte: minPrice }),
    ...(maxPrice != null && { lte: maxPrice }),
  };

  const wantsVenta =
    !operations ||
    operations.includes(OperationType.venta) ||
    operations.includes(OperationType.venta_alquiler);
  const wantsAlquiler =
    !operations ||
    operations.includes(OperationType.alquiler) ||
    operations.includes(OperationType.venta_alquiler);

  const conds: Prisma.PropertyWhereInput[] = [];
  // A hidden sale price must not be discoverable by narrowing the price range.
  if (wantsVenta) conds.push({ salePrice: range, hideSalePrice: false });
  if (wantsAlquiler) conds.push({ rentPrice: range });
  if (conds.length === 1) return conds[0];
  return { OR: conds };
}

function rangeOf(min?: number, max?: number) {
  if (min == null && max == null) return undefined;
  return {
    ...(min != null && { gte: min }),
    ...(max != null && { lte: max }),
  };
}

export async function getProperties(filters: PropertyFilters = {}) {
  const {
    propertyTypes,
    operationTypes,
    localities,
    neighborhoods,
    currency,
    minPrice,
    maxPrice,
    minRooms,
    minBedrooms,
    minAge,
    maxAge,
    minCoveredSurface,
    maxCoveredSurface,
    minTotalSurface,
    maxTotalSurface,
    q,
    orderBy = "recent",
    pageSize = 12,
  } = filters;
  const page = Math.min(Math.max(filters.page ?? 1, 1), MAX_PAGE);

  const expandedOps = expandOperations(operationTypes);
  const priceCond = priceWhere(expandedOps, minPrice, maxPrice);
  const surfaceCovered = rangeOf(minCoveredSurface, maxCoveredSurface);
  const surfaceTotal = rangeOf(minTotalSurface, maxTotalSurface);
  const ageRange = rangeOf(minAge, maxAge);

  const trimmedQ = q?.trim().slice(0, MAX_QUERY_LENGTH);
  const textOr: Prisma.PropertyWhereInput[] = [];
  if (trimmedQ) {
    const pattern = escapeLike(trimmedQ);
    textOr.push(
      { title: { contains: pattern, mode: "insensitive" } },
      { description: { contains: pattern, mode: "insensitive" } },
      { neighborhood: { contains: pattern, mode: "insensitive" } },
      { address: { contains: pattern, mode: "insensitive" } },
    );
    // Amenities is free-form JSON — cast to text and ILIKE it to catch
    // keywords like "pileta", "parrilla", "cochera cubierta" etc.
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM properties
      WHERE organization_id = ${ORGANIZATION_ID}
        AND is_published = true
        AND status = 'disponible'
        AND amenities::text ILIKE ${"%" + pattern + "%"}
    `;
    if (rows.length > 0) {
      textOr.push({ id: { in: rows.map((r) => r.id) } });
    }
  }

  const where: Prisma.PropertyWhereInput = {
    ...PUBLIC_WHERE,
    ...(propertyTypes && propertyTypes.length > 0 && { propertyType: { in: propertyTypes } }),
    ...(expandedOps && { operationType: { in: expandedOps } }),
    ...(localities && localities.length > 0 && { locality: { in: localities } }),
    ...(neighborhoods && neighborhoods.length > 0 && { neighborhood: { in: neighborhoods } }),
    ...(currency && { currency }),
    ...(minRooms != null && { rooms: { gte: minRooms } }),
    ...(minBedrooms != null && { bedrooms: { gte: minBedrooms } }),
    ...(ageRange && { age: ageRange }),
    ...(surfaceCovered && { coveredSurface: surfaceCovered }),
    ...(surfaceTotal && { totalSurface: surfaceTotal }),
    AND: [priceCond ?? {}, textOr.length > 0 ? { OR: textOr } : {}],
  };

  // Price sorting uses the rent price when only rentals are requested. Hidden
  // sale prices are grouped last so their position doesn't reveal the value.
  const onlyRentals =
    operationTypes?.length === 1 && operationTypes[0] === OperationType.alquiler;
  const priceField = onlyRentals ? "rentPrice" : "salePrice";
  const direction = orderBy === "price_desc" ? "desc" : "asc";
  const orderByClause: Prisma.PropertyOrderByWithRelationInput[] =
    orderBy === "recent"
      ? [{ createdAt: "desc" }]
      : onlyRentals
        ? [{ [priceField]: { sort: direction, nulls: "last" } }]
        : [{ hideSalePrice: "asc" }, { [priceField]: { sort: direction, nulls: "last" } }];

  const [rows, total] = await Promise.all([
    prisma.property.findMany({
      where,
      select: CARD_SELECT,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderByClause,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties: rows.map(toCard),
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  };
}

// Deduplicated per request: generateMetadata and the page share one fetch.
export const getPropertyById = cache(async (id: string) => {
  const result = await prisma.property.findFirst({
    where: {
      id,
      organizationId: ORGANIZATION_ID,
      isPublished: true,
    },
    include: INCLUDE_PROPERTY,
  });
  return result ? serialize(result) : null;
});

export async function getPublishedPropertyIds() {
  const rows = await prisma.property.findMany({
    where: PUBLIC_WHERE,
    select: { id: true, updatedAt: true },
  });
  return rows;
}

export const getLocalities = unstable_cache(
  async () => {
    const result = await prisma.property.groupBy({
      by: ["locality"],
      where: PUBLIC_WHERE,
      orderBy: { locality: "asc" },
    });
    return result.map((r) => r.locality);
  },
  ["localities"],
  { revalidate: 300, tags: ["properties"] }
);

export const getNeighborhoods = unstable_cache(
  async () => {
    const result = await prisma.property.groupBy({
      by: ["neighborhood"],
      where: { ...PUBLIC_WHERE, neighborhood: { not: null } },
      orderBy: { neighborhood: "asc" },
    });
    return result
      .map((r) => r.neighborhood)
      .filter((n): n is string => Boolean(n));
  },
  ["neighborhoods"],
  { revalidate: 300, tags: ["properties"] }
);

export async function getPropertiesByIds(ids: string[]): Promise<PropertyCardData[]> {
  if (ids.length === 0) return [];
  // Favorites keep showing published properties even if they were sold since.
  const rows = await prisma.property.findMany({
    where: {
      id: { in: ids },
      organizationId: ORGANIZATION_ID,
      isPublished: true,
    },
    select: CARD_SELECT,
  });
  return rows.map(toCard);
}

export async function getPropertyCount() {
  return prisma.property.count({ where: PUBLIC_WHERE });
}

export const getRentalCount = unstable_cache(
  async () =>
    prisma.property.count({
      where: {
        ...PUBLIC_WHERE,
        operationType: { in: [OperationType.alquiler, OperationType.venta_alquiler] },
      },
    }),
  ["rental-count"],
  { revalidate: 300, tags: ["properties"] }
);
