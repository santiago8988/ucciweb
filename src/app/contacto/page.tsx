import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Clock,
  Mail,
  MessageCircle,
  ArrowUpRight,
} from "lucide-react";
import {
  CONTACT_DEPARTMENTS,
  OFFICE,
  buildWhatsAppUrl,
  buildTelUrl,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Comunicate con UCCI Propiedades por teléfono o WhatsApp. Alquileres, alquiler temporario y compra/venta en Mar del Plata.",
};

export default function ContactoPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink pt-36 pb-24 md:pt-44 md:pb-32">
        <Image
          src="https://images.unsplash.com/photo-1561906787-9894a1f78a0c?w=1920&q=80"
          alt="Atardecer en Mar del Plata"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-light text-white sm:text-5xl lg:text-6xl">
              Contactanos
            </h1>
            <p className="mt-5 text-lg text-white/70 font-light max-w-xl">
              Estamos a un llamado o WhatsApp de distancia. Escribinos al área que
              mejor se ajuste a tu consulta y te respondemos a la brevedad.
            </p>
          </div>
        </div>
      </section>

      {/* Office info bar */}
      <section className="relative -mt-14 z-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              icon={MapPin}
              title="Oficina"
              primary={OFFICE.address}
              secondary={OFFICE.city}
              href={OFFICE.mapsUrl}
              external
            />
            <InfoCard
              icon={Phone}
              title="Teléfono"
              primary="+54 9 223 537-5248"
              secondary="Lunes a viernes, 9 a 18hs"
              href={buildTelUrl("+5492235375248")}
            />
            <InfoCard
              icon={Mail}
              title="Email"
              primary={OFFICE.email}
              secondary="Respuesta en menos de 24hs"
              href={`mailto:${OFFICE.email}`}
            />
            <InfoCard
              icon={Clock}
              title="Horario Oficina"
              primary="Lun - Vie · 9 a 18hs"
              secondary="Sábados con cita previa"
            />
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-dark mb-2">
              Áreas de atención
            </p>
            <h2 className="text-3xl font-light text-ink sm:text-4xl">
              Elegí cómo querés contactarnos
            </h2>
            <div className="mt-4 h-px bg-gradient-to-r from-brand to-transparent max-w-xs" />
            <p className="mt-5 text-ink/60 leading-relaxed">
              Cada área tiene su canal directo para que tu consulta llegue a la
              persona indicada. Tocá el botón y te atendemos al instante.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CONTACT_DEPARTMENTS.map((dept) => (
              <div
                key={dept.id}
                className="relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-brand/40"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand to-brand-dark" />

                <h3 className="text-xl font-semibold text-ink">{dept.name}</h3>
                <p className="mt-2 text-sm text-ink/60 leading-relaxed">
                  {dept.description}
                </p>

                <div className="mt-6 flex flex-col gap-2">
                  {dept.channels.map((channel, i) =>
                    channel.kind === "phone" ? (
                      <a
                        key={`${dept.id}-p-${i}`}
                        href={buildTelUrl(channel.tel)}
                        className="group flex items-center gap-3 rounded-xl border border-ink/10 bg-sand-soft/40 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-sand-soft hover:border-ink/20"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink border border-ink/10">
                          <Phone className="h-4 w-4" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[10px] uppercase tracking-widest text-ink/50">
                            Teléfono
                          </span>
                          {channel.display}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-ink/40 group-hover:text-ink transition-colors" />
                      </a>
                    ) : (
                      <a
                        key={`${dept.id}-w-${i}`}
                        href={buildWhatsAppUrl(
                          channel.waNumber,
                          `Hola UCCI Propiedades, consulto por ${dept.name.toLowerCase()}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-brand-dark hover:text-white"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink">
                          <MessageCircle className="h-4 w-4" />
                        </span>
                        <span className="flex-1">
                          <span className="block text-[10px] uppercase tracking-widest text-ink/60 group-hover:text-white/70">
                            WhatsApp
                          </span>
                          {channel.display}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-ink/50 group-hover:text-white transition-colors" />
                      </a>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office & Socials */}
      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 overflow-hidden rounded-3xl border border-ink/10 bg-sand-soft/40 lg:grid-cols-2">
            <div className="p-10 lg:p-14">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-dark mb-2">
                Visitanos
              </p>
              <h2 className="text-3xl font-light text-ink sm:text-4xl">
                {OFFICE.address}
              </h2>
              <p className="mt-3 text-ink/60">{OFFICE.city}</p>

              <div className="mt-8 space-y-3">
                <a
                  href={OFFICE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-brand-dark transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  Cómo llegar en Google Maps
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="relative min-h-[340px] lg:min-h-full">
              <iframe
                src="https://maps.google.com/maps?q=UCCI+Propiedades+Mar+del+Plata&z=17&output=embed"
                className="absolute inset-0 h-full w-full border-0 grayscale-[20%]"
                loading="lazy"
                title="Ubicación de UCCI Propiedades"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  primary,
  secondary,
  href,
  external = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  primary: string;
  secondary: string;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <div className="rounded-2xl bg-white p-6 shadow-lg border border-ink/5 h-full transition-all hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft mb-4">
        <Icon className="h-5 w-5 text-brand-dark" />
      </div>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink/50">
        {title}
      </h3>
      <p className="mt-1 font-medium text-ink">{primary}</p>
      <p className="mt-1 text-xs text-ink/50">{secondary}</p>
    </div>
  );

  if (!href) return body;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    );
  }

  return <Link href={href}>{body}</Link>;
}
