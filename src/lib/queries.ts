import { prisma } from "./prisma";
import { ORGANIZATION_ID } from "./env";
import { PropertyType, OperationType, Currency, Prisma } from "@/generated/prisma";

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

const INCLUDE_PROPERTY = {
  images: { orderBy: { order: "asc" as const } },
  videos: { orderBy: { order: "asc" as const } },
  agent: true,
};

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function getFeaturedProperties() {
  const result = await prisma.property.findMany({
    where: {
      organizationId: ORGANIZATION_ID,
      isPublished: true,
      status: "disponible",
      featured: true,
    },
    include: INCLUDE_PROPERTY,
    take: 6,
    orderBy: { createdAt: "desc" },
  });
  return serialize(result);
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
  if (wantsVenta) conds.push({ salePrice: range });
  if (wantsAlquiler) conds.push({ rentPrice: range });
  if (conds.length === 1) return conds[0];
  return { OR: conds };
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
    page = 1,
    pageSize = 12,
  } = filters;

  const expandedOps = expandOperations(operationTypes);
  const priceCond = priceWhere(expandedOps, minPrice, maxPrice);

  const surfaceCovered =
    minCoveredSurface != null || maxCoveredSurface != null
      ? {
          ...(minCoveredSurface != null && { gte: minCoveredSurface }),
          ...(maxCoveredSurface != null && { lte: maxCoveredSurface }),
        }
      : undefined;

  const surfaceTotal =
    minTotalSurface != null || maxTotalSurface != null
      ? {
          ...(minTotalSurface != null && { gte: minTotalSurface }),
          ...(maxTotalSurface != null && { lte: maxTotalSurface }),
        }
      : undefined;

  const ageRange =
    minAge != null || maxAge != null
      ? {
          ...(minAge != null && { gte: minAge }),
          ...(maxAge != null && { lte: maxAge }),
        }
      : undefined;

  const trimmedQ = q?.trim();
  const textOr: Prisma.PropertyWhereInput[] = [];
  if (trimmedQ) {
    textOr.push(
      { title: { contains: trimmedQ, mode: "insensitive" } },
      { description: { contains: trimmedQ, mode: "insensitive" } },
      { neighborhood: { contains: trimmedQ, mode: "insensitive" } },
      { address: { contains: trimmedQ, mode: "insensitive" } },
    );
    // Amenities is free-form JSON — cast to text and ILIKE it to catch
    // keywords like "pileta", "parrilla", "cochera cubierta" etc.
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM properties
      WHERE organization_id = ${ORGANIZATION_ID}
        AND amenities::text ILIKE ${"%" + trimmedQ + "%"}
    `;
    if (rows.length > 0) {
      textOr.push({ id: { in: rows.map((r) => r.id) } });
    }
  }

  const where: Prisma.PropertyWhereInput = {
    organizationId: ORGANIZATION_ID,
    isPublished: true,
    status: "disponible",
    ...(propertyTypes && propertyTypes.length > 0 && { propertyType: { in: propertyTypes } }),
    ...(expandedOps && { operationType: { in: expandedOps } }),
    ...(localities && localities.length > 0 && { locality: { in: localities } }),
    ...(neighborhoods && neighborhoods.length > 0 && { neighborhood: { in: neighborhoods } }),
    ...(currency && { currency }),
    ...(priceCond && priceCond),
    ...(minRooms != null && { rooms: { gte: minRooms } }),
    ...(minBedrooms != null && { bedrooms: { gte: minBedrooms } }),
    ...(ageRange && { age: ageRange }),
    ...(surfaceCovered && { coveredSurface: surfaceCovered }),
    ...(surfaceTotal && { totalSurface: surfaceTotal }),
    ...(textOr.length > 0 && { OR: textOr }),
  };

  const orderByClause: Prisma.PropertyOrderByWithRelationInput =
    orderBy === "price_asc"
      ? { salePrice: "asc" }
      : orderBy === "price_desc"
        ? { salePrice: "desc" }
        : { createdAt: "desc" };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: INCLUDE_PROPERTY,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderByClause,
    }),
    prisma.property.count({ where }),
  ]);

  return {
    properties: serialize(properties),
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  };
}

export async function getPropertyById(id: string) {
  const result = await prisma.property.findFirst({
    where: {
      id,
      organizationId: ORGANIZATION_ID,
      isPublished: true,
    },
    include: INCLUDE_PROPERTY,
  });
  return result ? serialize(result) : null;
}

export async function getLocalities() {
  const result = await prisma.property.findMany({
    where: {
      organizationId: ORGANIZATION_ID,
      isPublished: true,
      status: "disponible",
    },
    select: { locality: true },
    distinct: ["locality"],
    orderBy: { locality: "asc" },
  });
  return result.map((r) => r.locality);
}

export async function getNeighborhoods() {
  const result = await prisma.property.findMany({
    where: {
      organizationId: ORGANIZATION_ID,
      isPublished: true,
      status: "disponible",
      neighborhood: { not: null },
    },
    select: { neighborhood: true },
    distinct: ["neighborhood"],
    orderBy: { neighborhood: "asc" },
  });
  return result
    .map((r) => r.neighborhood)
    .filter((n): n is string => Boolean(n));
}

export async function getPropertiesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const result = await prisma.property.findMany({
    where: {
      id: { in: ids },
      organizationId: ORGANIZATION_ID,
      isPublished: true,
    },
    include: INCLUDE_PROPERTY,
  });
  return serialize(result);
}

export async function getPropertyCount() {
  return prisma.property.count({
    where: {
      organizationId: ORGANIZATION_ID,
      isPublished: true,
      status: "disponible",
    },
  });
}
