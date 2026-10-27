import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowUpRight, Instagram, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { OFFICE, buildTelUrl, buildWhatsAppUrl } from "@/lib/constants";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import logoFooter from "@/assets/logo-ucci-margen.png";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

const WA_MESSAGE = "Hola Ucci Propiedades, me gustaria hacer una consulta.";

export function Footer() {
  return (
    <footer className="bg-stone text-ink">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-12 py-16 md:flex-row md:flex-wrap md:justify-between">
          {/* Brand */}
          <div className="md:max-w-xs">
            <Link href="/" className="flex mb-5">
              <Image
                src={logoFooter}
                alt="Atilio Ucci e Hijos Propiedades"
                sizes="213px"
                className="w-2/3 h-auto"
              />
            </Link>
            <p className="text-sm leading-relaxed text-ink">
              Desde 1969 acompañando a nuestros clientes en la búsqueda de su
              próximo hogar o inversión.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialIcon href={OFFICE.instagram} icon={Instagram} label="Instagram" />
              <SocialIcon href={OFFICE.facebook} icon={FacebookFilled} label="Facebook" />
              <SocialIcon
                href={buildWhatsAppUrl(OFFICE.whatsapp.waNumber, WA_MESSAGE)}
                icon={WhatsAppIcon}
                label="WhatsApp"
              />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-ink">
              Navegación
            </h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink hover:text-ink transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-ink">
              Horarios
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-ink shrink-0" />
                <span className="text-sm">
                  Lunes a viernes
                  <br />
                  <span className="text-ink">9:00 a 13:00 hs · 15:00 a 18:30 hs</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-ink shrink-0" />
                <span className="text-sm">
                  Sábados
                  <br />
                  <span className="text-ink">10:00 a 13:00 hs</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-ink shrink-0" />
                <span className="text-sm">
                  Domingos
                  <br />
                  <span className="text-ink">Cerrado</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-ink">
              Contacto
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-ink shrink-0" />
                <span className="text-sm">
                  {OFFICE.address}
                  <br />
                  <span className="text-ink">{OFFICE.city}</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-ink shrink-0" />
                <a
                  href={buildTelUrl(OFFICE.whatsapp.tel)}
                  className="text-sm hover:text-ink transition-colors"
                >
                  {OFFICE.whatsapp.display}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-ink shrink-0" />
                <a
                  href={`mailto:${OFFICE.email}`}
                  className="text-sm hover:text-ink transition-colors break-all"
                >
                  {OFFICE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-ink/10" />

        <div className="flex flex-col items-center justify-between gap-4 py-6 text-xs text-ink md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} UCCI Propiedades. Todos los derechos reservados. ·{" "}
            <Link href="/privacidad" className="underline underline-offset-2">
              Política de privacidad
            </Link>
          </p>
          <p>Mar del Plata, Argentina</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 bg-ink/5 text-ink transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-black hover:border-brand active:scale-90"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

function FacebookFilled({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.989 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
