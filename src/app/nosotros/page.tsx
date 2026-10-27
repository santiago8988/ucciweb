import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { OFFICE, buildWhatsAppUrl } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";
import heroImage from "@/assets/hero-playa-grande.jpg";

export const metadata: Metadata = {
  alternates: { canonical: "/nosotros" },
  title: "Nosotros",
  description:
    "Conocé a UCCI Propiedades. Inmobiliaria familiar en Playa Grande, Mar del Plata, desde 1969.",
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
          src={heroImage}
          alt="Playa Grande, Mar del Plata"
          fill
          sizes="100vw"
          placeholder="blur"
          className="object-cover opacity-40"
          preload
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.4)_100%)]" />

        <div className="content-wrap relative z-10">
          <div className="@container">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white mb-5">
              U C C I &nbsp; P R O P I E D A D E S
            </p>
            {/* One line at every width: the size follows the container width
                (the phrase is ~17.7em wide), up to 3.75rem. */}
            <h1 className="whitespace-nowrap font-light leading-tight text-white text-[length:min(3.75rem,calc(100cqw/18))]">
              Donde la experiencia se ejerce con vocación
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
              {/* Slightly smaller on phones so it takes 2 lines, not 3 with "1969" alone */}
              <h2 className="title-h2 mb-10 max-sm:text-[27pt] max-sm:tracking-[0.02em]">
                Una inmobiliaria familiar desde 1969
              </h2>
              <div className="space-y-5 text-ink/80 leading-relaxed text-base">
                <p>
                  Ucci Propiedades es una inmobiliaria familiar, situada en Playa Grande, Mar
                  del Plata, desde 1969. Su fundador Atilio Ucci (padre) ha dejado un legado
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
              href={buildWhatsAppUrl(OFFICE.whatsapp.waNumber, "Hola Ucci Propiedades. Quiero vender/tasar mi propiedad")}
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
