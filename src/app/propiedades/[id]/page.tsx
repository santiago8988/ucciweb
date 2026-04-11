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
  OPERATION_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  SITE_NAME,
  CONTACT_DEPARTMENTS,
  buildWhatsAppUrl,
  buildTelUrl,
} from "@/lib/constants";
import {
  formatPrice,
  formatSurface,
  getPropertyPrice,
  HIDDEN_LOCATION_LABEL,
} from "@/lib/format";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) return { title: "Propiedad no encontrada" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const price = getPropertyPrice(property as any);
  const where = property.hideLocation ? "Mar del Plata" : property.locality;
  return {
    title: property.title,
    description: `${PROPERTY_TYPE_LABELS[property.propertyType]} en ${property.operationType} - ${where}. ${price}. ${property.description?.slice(0, 150) || ""}`,
    openGraph: {
      title: `${property.title} | ${SITE_NAME}`,
      description: property.description || "",
      images: property.images[0]?.imageUrl ? [property.images[0].imageUrl] : [],
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
  const operationLabel = OPERATION_TYPE_LABELS[property.operationType] || property.operationType;
  const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType;
  const amenities = (property.amenities as string[] | null) || [];
  const services = (property.services as string[] | null) || [];

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
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back */}
        <Link
          href="/propiedades"
          className={cn(buttonVariants({ variant: "ghost" }), "mb-4")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a propiedades
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <ImageGallery images={property.images} />

            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="bg-brand text-ink">{operationLabel}</Badge>
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
                  <p className="text-3xl font-bold text-brand-dark">{price}</p>
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
            {property.videos.length > 0 && (
              <>
                <Separator className="my-6" />
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Videos</h2>
                <div className="grid gap-4">
                  {property.videos.map((video) => (
                    <div key={video.id} className="aspect-video rounded-lg overflow-hidden">
                      <iframe
                        src={video.videoUrl}
                        title={video.title || "Video de la propiedad"}
                        className="h-full w-full"
                        allowFullScreen
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              {/* Agent card */}
              {property.agent && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Agente inmobiliario</h3>
                    <div className="flex items-center gap-3">
                      {property.agent.avatarUrl ? (
                        <Image
                          src={property.agent.avatarUrl}
                          alt={property.agent.fullName}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-softer text-brand-dark font-bold text-lg">
                          {property.agent.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{property.agent.fullName}</p>
                        {property.agent.licenseNumber && (
                          <p className="text-xs text-gray-500">Mat. {property.agent.licenseNumber}</p>
                        )}
                      </div>
                    </div>
                    {property.agent.bio && (
                      <p className="mt-3 text-sm text-gray-500">{property.agent.bio}</p>
                    )}
                    <div className="mt-4 space-y-2">
                      {property.agent.phone && (
                        <a
                          href={buildTelUrl(property.agent.phone)}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "w-full justify-start"
                          )}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          {property.agent.phone}
                        </a>
                      )}
                      {property.agent.phone && (
                        <a
                          href={buildWhatsAppUrl(property.agent.phone, waMessage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "w-full justify-start border-brand/50 bg-brand-soft text-ink hover:bg-brand hover:text-ink"
                          )}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact CTA — phone + WhatsApp only, no email form */}
              <Card className="bg-brand-soft border-brand/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-ink mb-1">
                    ¿Te interesa esta propiedad?
                  </h3>
                  <p className="text-sm text-ink/60 mb-5">
                    Contactanos para más información o para agendar una visita.
                  </p>
                  <div className="space-y-2">
                    {waChannel && waChannel.kind === "whatsapp" && (
                      <a
                        href={buildWhatsAppUrl(waChannel.waNumber, waMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants(),
                          "w-full bg-brand text-ink hover:bg-brand-dark hover:text-white shadow-sm"
                        )}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp · {waChannel.display}
                      </a>
                    )}
                    {telChannel && telChannel.kind === "phone" && (
                      <a
                        href={buildTelUrl(telChannel.tel)}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full border-ink/15 hover:bg-white"
                        )}
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Llamar · {telChannel.display}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Map — hidden when hideLocation is true */}
              {!property.hideLocation && property.latitude && property.longitude && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Ubicación</h3>
                    <div className="aspect-square rounded-lg overflow-hidden">
                      <iframe
                        src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                        className="h-full w-full border-0"
                        loading="lazy"
                        title="Ubicación de la propiedad"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
