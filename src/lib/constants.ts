export const SITE_NAME = "UCCI Propiedades";
export const SITE_DESCRIPTION =
  "Encontrá tu próximo hogar en Mar del Plata con UCCI Propiedades. Casas, departamentos, terrenos y más en las mejores zonas de la ciudad.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://uccipropiedades.com";

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  casa: "Casa",
  departamento: "Departamento",
  terreno: "Terreno",
  local_comercial: "Local Comercial",
  oficina: "Oficina",
  cochera: "Cochera",
  galpon: "Galpón",
};

export const OPERATION_TYPE_LABELS: Record<string, string> = {
  venta: "Venta",
  alquiler: "Alquiler",
  venta_alquiler: "Venta/Alquiler",
};

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

export const CONTACT_DEPARTMENTS: ContactDepartment[] = [
  {
    id: "alquileres",
    name: "Alquileres permanentes",
    description: "Contratos anuales, profesionales y comerciales.",
    channels: [
      { kind: "whatsapp", display: "+54 9 223 681 2928", waNumber: "5492236812928" },
      { kind: "whatsapp", display: "+54 9 223 537 5248", waNumber: "5492235375248" },
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
];

export function buildWhatsAppUrl(number: string, message?: string): string {
  const cleaned = number.replace(/\D/g, "");
  const base = `https://wa.me/${cleaned}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildTelUrl(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}
