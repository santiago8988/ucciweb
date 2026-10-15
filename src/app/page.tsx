import { Hero } from "@/components/home/hero";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { CTASection } from "@/components/home/cta-section";
import { getFeaturedProperties, getPropertyCount, getRentalCount } from "@/lib/queries";

export const revalidate = 60;

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
