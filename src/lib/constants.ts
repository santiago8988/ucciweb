export const SITE_NAME = "UCCI Propiedades";
export const SITE_DESCRIPTION =
  "Encontrá tu próximo hogar en Mar del Plata con UCCI Propiedades. Casas, departamentos, terrenos y más en las mejores zonas de la ciudad.";
// Canonical origin for sitemap, robots, canonical URLs and Open Graph. Must be
// set per environment (see .env.example); no trailing slash.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.uccipropiedades.com"
).replace(/\/$/, "");

// Single source of truth for property types: keep in sync with the PropertyType
// enum in prisma/schema.prisma (filters, hero select and labels all derive from it).
export const PROPERTY_TYPES = [
  "casa",
  "departamento",
  "ph",
  "chalet",
  "ph_chalet",
  "terreno",
  "local_comercial",
  "oficina",
  "cochera",
  "galpon",
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyTypeValue, string> = {
  casa: "Casa",
  departamento: "Departamento",
  ph: "PH",
  chalet: "Chalet",
  ph_chalet: "PH / Chalet",
  terreno: "Terreno",
  local_comercial: "Local Comercial",
  oficina: "Oficina",
  cochera: "Cochera",
  galpon: "Galpón",
};

export function propertyTypeLabel(type: string): string {
  return PROPERTY_TYPE_LABELS[type as PropertyTypeValue] ?? type;
}

export const OPERATION_TYPES = ["venta", "alquiler", "venta_alquiler"] as const;

export type OperationTypeValue = (typeof OPERATION_TYPES)[number];

export const OPERATION_TYPE_LABELS: Record<OperationTypeValue, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  venta_alquiler: "Venta/Alquiler",
};

// Lowercase phrasing for sentences ("Casa en venta").
export const OPERATION_TYPE_PHRASES: Record<OperationTypeValue, string> = {
  venta: "en venta",
  alquiler: "en alquiler",
  venta_alquiler: "en venta y alquiler",
};

export function operationTypeLabel(op: string): string {
  return OPERATION_TYPE_LABELS[op as OperationTypeValue] ?? op;
}

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible",
  reservada: "Reservada",
  vendida: "Vendida",
  alquilada: "Alquilada",
  en_construccion: "En Construcción",
};

export const OFFICE = {
  address: "Matheu 326",
  city: "Mar del Plata, Buenos Aires",
  email: "info@uccipropiedades.com",
  mainPhone: { display: "223 451-2205", tel: "+542234512205" },
  // Main WhatsApp line (footer, /contacto, /nosotros). Single source of truth.
  whatsapp: { display: "+54 9 223 537-5248", waNumber: "5492235375248", tel: "+5492235375248" },
  instagram: "https://www.instagram.com/uccipropiedades/",
  facebook: "https://www.facebook.com/p/UCCI-propiedades-100063504282280/",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=UCCI+Propiedades+Mar+del+Plata",
} as const;

export type ContactChannel =
  | { kind: "phone"; display: string; tel: string }
  | { kind: "whatsapp"; display: string; waNumber: string };

export type ContactDepartment = {
  id: string;
  name: string;
  description: string;
  channels: ContactChannel[];
};

// Order = order of the cards on /contacto.
export const CONTACT_DEPARTMENTS: ContactDepartment[] = [
  {
    id: "compra-venta",
    name: "Compra / Venta / Tasaciones",
    description: "Operaciones de compraventa, tasaciones y asesoramiento.",
    channels: [
      { kind: "whatsapp", display: "+54 9 223 681 2928", waNumber: "5492236812928" },
      { kind: "whatsapp", display: "+54 9 223 537 5248", waNumber: "5492235375248" },
      { kind: "phone", display: "223 451-2205", tel: "+542234512205" },
    ],
  },
  {
    id: "alquileres",
    name: "Alquileres permanentes",
    description: "Contratos anuales, profesionales y comerciales.",
    // First WhatsApp = RENTALS_WHATSAPP (home "Alquilar" tab, empty rentals search).
    channels: [
      { kind: "whatsapp", display: "+54 9 223 537 5248", waNumber: "5492235375248" },
      { kind: "whatsapp", display: "+54 9 223 681 2928", waNumber: "5492236812928" },
      { kind: "phone", display: "223 451-2205", tel: "+542234512205" },
    ],
  },
  {
    id: "temporario",
    name: "Alquileres temporarios",
    description: "Temporada de verano, fines de semana y estadías breves.",
    channels: [
      { kind: "whatsapp", display: "+54 9 223 538 2653", waNumber: "5492235382653" },
      { kind: "phone", display: "223 451-2205", tel: "+542234512205" },
    ],
  },
];

function firstWhatsApp(departmentId: string): string {
  const channel = CONTACT_DEPARTMENTS.find((d) => d.id === departmentId)?.channels.find(
    (c) => c.kind === "whatsapp"
  );
  if (!channel || channel.kind !== "whatsapp") {
    throw new Error(`Missing WhatsApp channel for department "${departmentId}"`);
  }
  return channel.waNumber;
}

export const RENTALS_WHATSAPP = firstWhatsApp("alquileres");
export const SALES_WHATSAPP = firstWhatsApp("compra-venta");

export function buildWhatsAppUrl(number: string, message?: string): string {
  const cleaned = number.replace(/\D/g, "");
  const base = `https://wa.me/${cleaned}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildTelUrl(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}
