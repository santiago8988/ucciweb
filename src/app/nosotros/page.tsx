import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Shield, Users, Award, Target, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { buildWhatsAppUrl } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Conocé a UCCI Propiedades. Tu inmobiliaria de confianza en Mar del Plata, Argentina.",
};

const VALUES = [
  {
    icon: Shield,
    title: "Confianza",
    description: "Transparencia y honestidad en cada operación inmobiliaria. Trabajamos con integridad para que cada decisión sea segura.",
  },
  {
    icon: Users,
    title: "Compromiso",
    description: "Nos involucramos en cada detalle para que logres tus objetivos. Tu satisfacción es nuestra prioridad.",
  },
  {
    icon: Award,
    title: "Profesionalismo",
    description: "Equipo capacitado y actualizado en el mercado inmobiliario marplatense, con las herramientas más modernas del sector.",
  },
  {
    icon: Target,
    title: "Resultados",
    description: "Orientados a encontrar la mejor solución para cada cliente, optimizando tiempos y maximizando valor.",
  },
];

const STATS = [
  { value: "+60", label: "Años de experiencia" },
  { value: "+3", label: "Generaciones de Martilleros" },
  { value: "24hs", label: "Tiempo de respuesta" },
];

const GALLERY_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1561816646-b5b12a9b92ed?w=800&q=80",
    alt: "Costa de Mar del Plata - Vista aérea",
    className: "col-span-2 row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1561815908-bb4926a2f4eb?w=600&q=80",
    alt: "Skyline de Mar del Plata",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1561906787-9894a1f78a0c?w=600&q=80",
    alt: "Atardecer en Mar del Plata",
    className: "",
  },
];

export default function NosotrosPage() {
  return (
    <div>
      {/* Hero with Mar del Plata background */}
      <section className="relative overflow-hidden bg-ink pt-40 pb-28 md:pt-48 md:pb-36">
        <Image
          src="https://images.unsplash.com/photo-1561816544-21ecbffa09a3?w=1920&q=80"
          alt="Mar del Plata costa"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand mb-4">
              Sobre nosotros
            </p>
            <h1 className="text-4xl font-light text-white sm:text-5xl lg:text-6xl leading-tight">
              Tu inmobiliaria en Mar del Plata
            </h1>
            <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-2xl font-light">
              En UCCI Propiedades conocemos cada rincón de la ciudad feliz.
              Te acompañamos a encontrar tu hogar ideal o la mejor inversión
              inmobiliaria en Mar del Plata y alrededores.
            </p>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {STATS.map((stat) => (
              <div key={stat.label} className="py-10 text-center">
                <p className="text-3xl font-semibold text-gray-900 md:text-4xl">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mar del Plata gallery */}
      <section className="py-24 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand mb-2">
              Nuestra ciudad
            </p>
            <h2 className="text-3xl font-light text-gray-900 sm:text-4xl">
              Mar del Plata, la ciudad feliz
            </h2>
            <div className="mt-4 h-px bg-gradient-to-r from-brand/40 to-transparent max-w-xs" />
            <p className="mt-5 text-gray-500 max-w-2xl leading-relaxed">
              Con sus playas icónicas, su arquitectura única y su calidad de vida incomparable,
              Mar del Plata es uno de los destinos más buscados para vivir e invertir en Argentina.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[240px]">
            {GALLERY_IMAGES.map((img) => (
              <div
                key={img.alt}
                className={cn(
                  "relative overflow-hidden rounded-xl group",
                  img.className
                )}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <p className="absolute bottom-3 left-4 text-sm font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {img.alt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand mb-2">
              Lo que nos define
            </p>
            <h2 className="text-3xl font-light text-gray-900 sm:text-4xl">
              Nuestros valores
            </h2>
            <div className="mt-4 h-px bg-gradient-to-r from-brand/40 to-transparent max-w-xs" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="group rounded-xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-softer"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-soft transition-colors group-hover:bg-brand">
                  <value.icon className="h-6 w-6 text-brand-dark transition-colors group-hover:text-ink" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-light text-gray-900 sm:text-4xl">
            ¿Listo para dar el próximo paso?
          </h2>
          <p className="mt-4 text-gray-500 leading-relaxed">
            Ya sea que busques comprar, vender o alquilar, estamos acá para acompañarte.
          </p>
          <div className="mt-8 flex flex-col gap-3 justify-center sm:flex-row">
            <a
              href={buildWhatsAppUrl("5492235375248", "Hola Ucci Propiedades. Quiero vender/tasar mi propiedad")}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "bg-brand text-black hover:bg-brand-dark hover:text-white px-8 h-12 font-semibold")}
            >
              <WhatsAppIcon className="mr-2 h-5 w-5" />
              Trabajar mi propiedad
            </a>
            <Link
              href="/propiedades"
              className={cn(buttonVariants({ size: "lg" }), "bg-brand text-black hover:bg-brand-dark hover:text-white px-8 h-12 font-semibold")}
            >
              Explorar propiedades
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
