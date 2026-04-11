import { Hero } from "@/components/home/hero";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { CTASection } from "@/components/home/cta-section";
import { getFeaturedProperties, getPropertyCount } from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const [featuredProperties, propertyCount] = await Promise.all([
    getFeaturedProperties(),
    getPropertyCount(),
  ]);

  return (
    <>
      <Hero propertyCount={propertyCount} />
      <FeaturedProperties properties={featuredProperties} />
      <CTASection />
    </>
  );
}
