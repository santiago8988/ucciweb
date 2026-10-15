import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { CTASection } from "@/components/home/cta-section";
import { getFeaturedProperties, getPropertyCount, getRentalCount } from "@/lib/queries";

// Fallback only: /api/revalidate expires the "properties" tag when data changes.
export const revalidate = 300;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const [featuredProperties, propertyCount, rentalCount] = await Promise.all([
    getFeaturedProperties(),
    getPropertyCount(),
    getRentalCount(),
  ]);

  return (
    <>
      <Hero propertyCount={propertyCount} rentalCount={rentalCount} />
      <FeaturedProperties properties={featuredProperties} />
      <CTASection />
    </>
  );
}
