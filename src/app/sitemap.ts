import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { ORGANIZATION_ID, SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await prisma.property.findMany({
    where: {
      organizationId: ORGANIZATION_ID,
      isPublished: true,
      status: "disponible",
    },
    select: { id: true, updatedAt: true },
  });

  const propertyUrls = properties.map((p) => ({
    url: `${SITE_URL}/propiedades/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/propiedades`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/nosotros`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...propertyUrls,
  ];
}
