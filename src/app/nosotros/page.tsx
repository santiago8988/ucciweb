import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { buildWhatsAppUrl } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Conocé a UCCI Propiedades. Inmobiliaria familiar en Playa Grande, Mar del Plata, desde 1970.",
};

const PILARES = [
  {
    title: "La palabra como compromiso",
    description:
      "Creemos que la confianza se construye con hechos, pero empieza por la palabra. Honramos cada acuerdo con la misma seriedad que un contrato, sosteniendo un modo de trabajar basado en la transparencia, el respeto y la coherencia en cada paso.",
  },
  {
    title: "Cada propiedad como caso único",
    description:
      "No trabajamos desde el volumen, sino desde la dedicación. Seleccionamos cuidadosamente las propiedades para poder brindarles la atención que merecen, entendiendo que detrás de cada operación hay historias, decisiones importantes y personas distintas.",
  },
  {
    title: "Acompañamiento de principio a fin",
    description:
      "Estamos presentes en todo el proceso, desde el primer contacto hasta el cierre de la operación. Facilitamos una comunicación clara entre las partes, acompañando con experiencia, cercanía y criterio para que cada decisión se tome con seguridad.",
  },
];

const GALLERY_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1561816646-b5b12a9b92ed?w=800&q=80",
    alt: "Costa de Mar del Plata - Vista aérea",
  },
  {
    src: "https://images.unsplash.com/photo-1561815908-bb4926a2f4eb?w=600&q=80",
    alt: "Skyline de Mar del Plata",
  },
  {
    src: "https://images.unsplash.com/photo-1561906787-9894a1f78a0c?w=600&q=80",
    alt: "Atardecer en Mar del Plata",
  },
];

export default function NosotrosPage() {
  return (
    <div>
      {/* 1 — Hero with photo and tagline */}
      <section className="relative overflow-hidden bg-ink pt-40 pb-28 md:pt-48 md:pb-36">
        <Image
          src="/hero-playa-grande.jpg"
          alt="Playa Grande, Mar del Plata"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.4)_100%)]" />

        <div className="content-wrap relative z-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white mb-5">
              U C C I &nbsp; P R O P I E D A D E S
            </p>
            <h1 className="text-4xl font-light text-white sm:text-5xl lg:text-6xl leading-tight">
              donde la experiencia se ejerce con vocación
            </h1>
          </div>
        </div>
      </section>

      {/* 2 — Nosotros (institutional copy + side images) */}
      <section className="py-24">
        <div className="content-wrap">
          <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16 lg:gap-20">
            {/* Text column */}
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-dark mb-3">
                Nosotros
              </p>
              <h2 className="title-h2 mb-10">
                Una inmobiliaria familiar desde 1970
              </h2>
              <div className="space-y-5 text-ink/80 leading-relaxed text-base">
                <p>
                  Ucci Propiedades es una inmobiliaria familiar, situada en Playa Grande, Mar
                  del Plata, desde 1970. Su fundador Atilio Ucci (padre) ha dejado un legado
                  claro: la palabra vale tanto como cualquier contrato. Sumado a muchas
                  historias sobre el crecimiento del barrio y su transformación.
                </p>
                <p>
                  Con la experiencia transmitida, actualmente trabajan, codo a codo, la
                  segunda y tercera generación de martilleros de la familia. Conformando un
                  equipo con vasto conocimiento en el mercado inmobiliario y bajo el mismo
                  sistema de valores heredados; amor por la profesión.
                </p>
                <p>
                  Nuestra misión es acompañar a las personas desde el inicio hasta el final
                  de la operación, fomentando la comunicación clara hacia ambas partes.
                </p>
                <p>
                  Calidad. No cantidad. Y dedicación, por supuesto. Estamos comprometidos a
                  trabajar con el número de propiedades que nos permita atender a todas
                  ellas como lo merecen.
                </p>
                <p>
                  En Ucci Propiedades no existe el generalismo. Cada propiedad es distinta y
                  cada cliente también. Nos apasiona encontrar la persona ideal para toda
                  propiedad y la vivienda perfecta para cada familia.
                </p>
              </div>
            </div>

            {/* Side images column — stacked, like Robles ref */}
            <div className="flex flex-col gap-5">
              {GALLERY_IMAGES.map((img) => (
                <div
                  key={img.alt}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl group"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 — Pilares diferenciales */}
      <section className="py-24">
        <div className="content-wrap">
          <div className="mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-dark mb-2">
              Lo que nos define
            </p>
            <h2 className="title-h2">
              Pilares diferenciales
            </h2>
            <div className="mt-4 h-px bg-gradient-to-r from-brand/40 to-transparent max-w-xs" />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PILARES.map((pilar) => (
              <div
                key={pilar.title}
                className="group rounded-xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-softer"
              >
                <h3 className="text-base font-semibold text-ink leading-snug">
                  {pilar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">
                  {pilar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50">
        <div className="content-wrap text-center max-w-2xl">
          <h2 className="title-h2">
            ¿Listo para dar el próximo paso?
          </h2>
          <p className="mt-4 text-ink/60 leading-relaxed">
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
