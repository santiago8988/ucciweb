import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getPublishedPropertyIds } from "@/lib/queries";

// Regenerated hourly so newly published properties get discovered.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getPublishedPropertyIds();

  const propertyUrls = properties.map((p) => ({
    url: `${SITE_URL}/propiedades/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/propiedades`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/nosotros`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contacto`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacidad`, changeFrequency: "yearly", priority: 0.1 },
    ...propertyUrls,
  ];
}
