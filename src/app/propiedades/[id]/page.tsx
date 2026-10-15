import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Bed, Bath, Maximize, Car, Calendar, Compass,
  Flame, ArrowLeft, Phone, Building, MessageCircle,
  CalendarClock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/property/image-gallery";
import { FavoriteButton } from "@/components/property/favorite-button";
import { getPropertyById } from "@/lib/queries";
import {
  OPERATION_TYPE_PHRASES,
  SITE_NAME,
  CONTACT_DEPARTMENTS,
  buildWhatsAppUrl,
  buildTelUrl,
  operationTypeLabel,
  propertyTypeLabel,
  type OperationTypeValue,
} from "@/lib/constants";
import {
  formatPrice,
  formatSurface,
  getPropertyPrice,
  HIDDEN_LOCATION_LABEL,
} from "@/lib/format";
import { toEmbedUrl } from "@/lib/video";
import { MobileContactBar } from "@/components/property/mobile-contact-bar";
import { MapEmbed } from "@/components/map-embed";

export const revalidate = 60;

// Required for ISR on a dynamic route in Next 16: an empty list means no page is
// prebuilt, each one is rendered on first visit and then cached for `revalidate`.
export async function generateStaticParams() {
  return [];
}

type PageProps = {
  params: Promise<{ id: string }>;
};

// Open Graph image through the optimizer: 1200 px wide JPEG/WebP of a few
// hundred KB instead of the multi-MB original (WhatsApp previews).
function ogImageUrl(imageUrl: string): string {
  return `/_next/image?url=${encodeURIComponent(imageUrl)}&w=1200&q=75`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) return { title: "Propiedad no encontrada" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- serialized Decimals become strings
  const price = getPropertyPrice(property as any);
  const where = property.hideLocation
    ? property.locality
    : [property.neighborhood, property.locality].filter(Boolean).join(", ");
  const summary = `${propertyTypeLabel(property.propertyType)} ${
    OPERATION_TYPE_PHRASES[property.operationType as OperationTypeValue] ?? ""
  } en ${where}. ${price}.`;
  const description = `${summary} ${property.description?.slice(0, 120) ?? ""}`.trim();
  const mainImage =
    property.images.find((img) => img.isMain)?.imageUrl ?? property.images[0]?.imageUrl;
  const path = `/propiedades/${property.id}`;

  return {
    title: property.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "es_AR",
      siteName: SITE_NAME,
      url: path,
      title: property.title,
      description,
      images: mainImage
        ? [{ url: ogImageUrl(mainImage), width: 1200, alt: property.title }]
        : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- serialized Decimals become strings
  const prop = property as any;
  const price = getPropertyPrice(prop);
  const operationLabel = operationTypeLabel(property.operationType);
  const typeLabel = propertyTypeLabel(property.propertyType);
  const amenities = (property.amenities as string[] | null) || [];
  const services = (property.services as string[] | null) || [];

  const embeddableVideos = property.videos
    .map((v) => ({ ...v, embedUrl: toEmbedUrl(v.videoUrl) }))
    .filter((v): v is typeof v & { embedUrl: string } => Boolean(v.embedUrl));

  // Default department: sales if "venta" in operation type, else alquileres
  const defaultDept =
    property.operationType === "venta"
      ? CONTACT_DEPARTMENTS.find((d) => d.id === "compra-venta")
      : CONTACT_DEPARTMENTS.find((d) => d.id === "alquileres");
  const waChannel = defaultDept?.channels.find((c) => c.kind === "whatsapp");
  const telChannel = defaultDept?.channels.find((c) => c.kind === "phone");
  const waMessage = `Hola UCCI Propiedades, me interesa la propiedad "${property.title}"${
    property.internalCode ? ` (cód. ${property.internalCode})` : ""
  }.`;

  // Always use the agent's celular for both WhatsApp and call when available.
  // Fall back: agent.phone, then department channels.
  const agentNumber = property.agent?.mobilePhone || property.agent?.phone || null;
  const contactWaNumber =
    agentNumber || (waChannel?.kind === "whatsapp" ? waChannel.waNumber : null);
  const contactWaDisplay = agentNumber || waChannel?.display || null;
  const contactTelNumber =
    agentNumber || (telChannel?.kind === "phone" ? telChannel.tel : null);
  const contactTelDisplay = agentNumber || telChannel?.display || null;

  const features = [
    { icon: Bed, label: "Dormitorios", value: property.bedrooms },
    { icon: Bath, label: "Baños", value: property.bathrooms },
    { icon: Maximize, label: "Superficie total", value: prop.totalSurface ? formatSurface(prop.totalSurface) : null },
    { icon: Maximize, label: "Superficie cubierta", value: prop.coveredSurface ? formatSurface(prop.coveredSurface) : null },
    { icon: Car, label: "Cocheras", value: property.parkingSpaces },
    { icon: Building, label: "Ambientes", value: property.rooms },
    { icon: Calendar, label: "Antigüedad", value: property.age != null ? `${property.age} años` : null },
    { icon: Compass, label: "Orientación", value: property.orientation },
    { icon: Flame, label: "Calefacción", value: property.heatingType },
  ].filter((f) => f.value != null && f.value !== "" && f.value !== 0);

  return (
    <div className="pt-24 pb-28 lg:pb-16">
      <div className="content-wrap">
        {/* Back */}
        <Link
          href="/propiedades"
          className={cn(buttonVariants({ variant: "ghost" }), "mb-4")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a propiedades
        </Link>

        {/* Explicit grid-cols-1 + min-w-0: otherwise the thumbnail strip's width
            stretches the implicit column far beyond the phone's viewport. */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="min-w-0 lg:col-span-2">
            <ImageGallery images={property.images} />

            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-brand text-black">{operationLabel}</Badge>
                <Badge variant="secondary">{typeLabel}</Badge>
                {property.internalCode && (
                  <Badge variant="outline">Código: {property.internalCode}</Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-gray-500">
                <MapPin className="h-4 w-4" />
                {property.hideLocation ? (
                  <>
                    {property.neighborhood && `${property.neighborhood}, `}
                    {property.locality}, {property.province}
                  </>
                ) : (
                  <>
                    {property.address}
                    {property.streetNumber && ` ${property.streetNumber}`}
                    {property.floor && `, Piso ${property.floor}`}
                    {property.apartment && ` ${property.apartment}`}
                    , {property.locality}, {property.province}
                  </>
                )}
              </p>
              {property.hideLocation && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-dark">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {HIDDEN_LOCATION_LABEL} para conocer la dirección exacta
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold text-ink">{price}</p>
                  {property.expenses && (
                    <p className="text-sm text-gray-500">
                      + {formatPrice(prop.expenses, property.currency)} expensas
                    </p>
                  )}
                </div>
                <FavoriteButton propertyId={property.id} variant="detail" />
              </div>
            </div>

            <Separator className="my-6" />

            {/* Features grid */}
            {features.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Características</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {features.map((f) => (
                    <div key={f.label} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                      <f.icon className="h-5 w-5 text-brand" />
                      <div>
                        <p className="text-xs text-gray-500">{f.label}</p>
                        <p className="font-medium text-gray-900">{f.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-6" />
              </>
            )}

            {/* Description */}
            {property.description && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
                <Separator className="my-6" />
              </>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <Badge key={a} variant="outline">{a}</Badge>
                  ))}
                </div>
                <Separator className="my-6" />
              </>
            )}

            {/* Services */}
            {services.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Servicios</h2>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </>
            )}

            {/* Videos */}
            {embeddableVideos.length > 0 && (
              <>
                <Separator className="my-6" />
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Videos</h2>
                <div className="grid gap-4">
                  {embeddableVideos.map((video) => (
                    <div
                      key={video.id}
                      className="aspect-video overflow-hidden rounded-xl bg-ink"
                    >
                      <iframe
                        src={video.embedUrl}
                        title={video.title || "Video de la propiedad"}
                        className="h-full w-full"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="min-w-0 lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              {/* Map — hidden when hideLocation is true. Placed on top so it aligns with the gallery. */}
              {!property.hideLocation && property.latitude && property.longitude && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Ubicación</h3>
                    <MapEmbed
                      query={`${property.latitude},${property.longitude}`}
                      title="Ubicación de la propiedad"
                      label={[property.neighborhood, property.locality].filter(Boolean).join(", ")}
                      className="aspect-square rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Contact CTA — prefers agent celular for both WhatsApp and call */}
              {(contactWaNumber || contactTelNumber) && (
                <Card className="bg-brand-soft border-brand/30">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-ink mb-1">
                      ¿Te interesa esta propiedad?
                    </h3>
                    <p className="text-sm text-ink/60 mb-5">
                      Contactanos para más información o para agendar una visita.
                    </p>
                    {property.agent && agentNumber && (
                      <div className="mb-4 flex items-center gap-3">
                        {property.agent.avatarUrl ? (
                          <Image
                            src={property.agent.avatarUrl}
                            alt={property.agent.fullName}
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-dark">
                            {property.agent.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-widest text-ink/50">
                            Te atiende
                          </p>
                          <p className="truncate text-sm font-semibold text-ink">
                            {property.agent.fullName}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {contactWaNumber && (
                        <a
                          href={buildWhatsAppUrl(contactWaNumber, waMessage)}
                          data-track="whatsapp"
                          data-property-code={property.internalCode ?? property.id}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants(),
                            "w-full bg-brand text-black hover:bg-brand-dark hover:text-white shadow-sm"
                          )}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp · {contactWaDisplay}
                        </a>
                      )}
                      {contactTelNumber && (
                        <a
                          href={buildTelUrl(contactTelNumber)}
                          data-track="call"
                          data-property-code={property.internalCode ?? property.id}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "w-full border-ink/15 hover:bg-white"
                          )}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Llamar · {contactTelDisplay}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Agent card — name + matricula only */}
              {property.agent && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink/50 mb-4">
                      Agente inmobiliario
                    </h3>
                    <div className="flex items-center gap-4">
                      {property.agent.avatarUrl ? (
                        <Image
                          src={property.agent.avatarUrl}
                          alt={property.agent.fullName}
                          width={56}
                          height={56}
                          className="h-14 w-14 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-softer text-xl font-bold text-brand-dark">
                          {property.agent.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">
                          {property.agent.fullName}
                        </p>
                        {property.agent.licenseNumber && (
                          <p className="mt-0.5 truncate text-xs text-ink/50">
                            Matrícula {property.agent.licenseNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    {property.agent.bio && (
                      <p className="mt-4 text-sm leading-relaxed text-ink/60">
                        {property.agent.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <MobileContactBar
        whatsappHref={contactWaNumber ? buildWhatsAppUrl(contactWaNumber, waMessage) : null}
        telHref={contactTelNumber ? buildTelUrl(contactTelNumber) : null}
        price={price}
        propertyCode={property.internalCode ?? property.id}
      />
    </div>
  );
}
