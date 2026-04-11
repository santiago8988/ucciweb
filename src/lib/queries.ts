import { prisma } from "./prisma";
import { ORGANIZATION_ID } from "./env";
import { PropertyType, OperationType } from "@prisma/client";

export type PropertyFilters = {
  propertyType?: PropertyType;
  operationType?: OperationType;
  locality?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  page?: number;
  pageSize?: number;
};

const INCLUDE_PROPERTY = {
  images: { orderBy: { order: "asc" as const } },
  videos: { orderBy: { order: "asc" as const } },
  agent: true,
};

// Prisma Decimal objects can't be passed to Client Components.
// This converts them to plain numbers/strings.
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

export async function getProperties(filters: PropertyFilters = {}) {
  const { propertyType, operationType, locality, minPrice, maxPrice, bedrooms, page = 1, pageSize = 12 } = filters;

  const where = {
    organizationId: ORGANIZATION_ID,
    isPublished: true,
    status: "disponible" as const,
    ...(propertyType && { propertyType }),
    ...(operationType && { operationType }),
    ...(locality && { locality: { contains: locality, mode: "insensitive" as const } }),
    ...(bedrooms && { bedrooms: { gte: bedrooms } }),
    ...(minPrice || maxPrice
      ? {
          OR: [
            {
              salePrice: {
                ...(minPrice && { gte: minPrice }),
                ...(maxPrice && { lte: maxPrice }),
              },
            },
            {
              rentPrice: {
                ...(minPrice && { gte: minPrice }),
                ...(maxPrice && { lte: maxPrice }),
              },
            },
          ],
        }
      : {}),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: INCLUDE_PROPERTY,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
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
