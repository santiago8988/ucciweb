import { OFFICE, SITE_NAME, SITE_URL, propertyTypeLabel } from "./constants";

const absolute = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url}`);

/** The agency itself (layout): name, address, hours, phone, social profiles. */
export function agencyJsonLd(logoPath: string) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#agency`,
    name: SITE_NAME,
    legalName: "Atilio Ucci e Hijos Propiedades",
    url: SITE_URL,
    logo: absolute(logoPath),
    image: absolute("/og-default.jpg"),
    telephone: OFFICE.mainPhone.tel,
    email: OFFICE.email,
    foundingDate: "1970",
    address: {
      "@type": "PostalAddress",
      streetAddress: OFFICE.address,
      addressLocality: "Mar del Plata",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "09:00", closes: "13:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "15:00", closes: "18:30" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "10:00", closes: "13:00" },
    ],
    sameAs: [OFFICE.instagram, OFFICE.facebook],
  };
}

type ListingInput = {
  id: string;
  title: string;
  description: string | null;
  propertyType: string;
  operationType: string;
  status: string;
  currency: string;
  salePrice: string | number | null;
  rentPrice: string | number | null;
  hideSalePrice: boolean;
  hideLocation: boolean;
  address: string;
  streetNumber: string | null;
  neighborhood: string | null;
  locality: string;
  province: string;
  latitude: string | number | null;
  longitude: string | number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  coveredSurface: string | number | null;
  totalSurface: string | number | null;
  createdAt: string | Date;
  publishedAt: string | Date | null;
  images: { imageUrl: string }[];
};

const AVAILABILITY: Record<string, string> = {
  disponible: "https://schema.org/InStock",
  reservada: "https://schema.org/LimitedAvailability",
  vendida: "https://schema.org/SoldOut",
  alquilada: "https://schema.org/SoldOut",
  en_construccion: "https://schema.org/PreOrder",
};

function placeType(propertyType: string) {
  if (propertyType === "casa" || propertyType === "chalet") return "House";
  if (propertyType === "departamento" || propertyType === "ph" || propertyType === "ph_chalet") return "Apartment";
  return "Place";
}

/** A property page: RealEstateListing with its offer. Hidden price/location stay hidden. */
export function listingJsonLd(p: ListingInput) {
  const url = `${SITE_URL}/propiedades/${p.id}`;
  const isRental = p.operationType === "alquiler";
  const price = isRental ? p.rentPrice : p.hideSalePrice ? null : p.salePrice ?? p.rentPrice;
  const surface = Number(p.coveredSurface ?? p.totalSurface) || null;

  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressLocality: p.locality,
    addressRegion: p.province,
    addressCountry: "AR",
  };
  if (!p.hideLocation) address.streetAddress = [p.address, p.streetNumber].filter(Boolean).join(" ");

  const place: Record<string, unknown> = {
    "@type": placeType(p.propertyType),
    name: `${propertyTypeLabel(p.propertyType)}${p.neighborhood ? ` en ${p.neighborhood}` : ""}`,
    address,
    ...(p.rooms != null && { numberOfRooms: p.rooms }),
    ...(p.bedrooms != null && { numberOfBedrooms: p.bedrooms }),
    ...(p.bathrooms != null && { numberOfBathroomsTotal: p.bathrooms }),
    ...(surface && { floorSize: { "@type": "QuantitativeValue", value: surface, unitCode: "MTK" } }),
  };
  if (!p.hideLocation && p.latitude != null && p.longitude != null) {
    place.geo = { "@type": "GeoCoordinates", latitude: Number(p.latitude), longitude: Number(p.longitude) };
  }

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": url,
    url,
    name: p.title,
    ...(p.description && { description: p.description.slice(0, 500) }),
    datePosted: new Date(p.publishedAt ?? p.createdAt).toISOString(),
    image: p.images.slice(0, 6).map((img) => absolute(img.imageUrl)),
    about: place,
    offers: {
      "@type": "Offer",
      url,
      businessFunction: isRental ? "https://schema.org/LeaseOut" : "https://schema.org/Sell",
      availability: AVAILABILITY[p.status] ?? "https://schema.org/InStock",
      ...(price != null && { price: Number(price), priceCurrency: p.currency }),
      seller: { "@id": `${SITE_URL}/#agency` },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
