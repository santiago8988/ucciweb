import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ArrowUpRight, Instagram, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { OFFICE, buildTelUrl, buildWhatsAppUrl } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

const PRIMARY_PHONE = { display: "+54 9 223 537-5248", tel: "+5492235375248", waNumber: "5492235375248" };
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
                src="/logo-ucci-margen.svg"
                alt="UCCI Propiedades"
                width={280}
                height={120}
                className="w-2/3 h-auto"
              />
            </Link>
            <p className="text-sm leading-relaxed text-ink">
              Más de 60 años acompañando a los marplatenses en la búsqueda de su
              próximo hogar o inversión.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialIcon href={OFFICE.instagram} icon={Instagram} label="Instagram" />
              <SocialIcon href={OFFICE.facebook} icon={FacebookFilled} label="Facebook" />
              <SocialIcon
                href={buildWhatsAppUrl(PRIMARY_PHONE.waNumber, WA_MESSAGE)}
                icon={WhatsApp}
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
                  <span className="text-ink">9:00 a 18:00 hs</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-ink shrink-0" />
                <span className="text-sm">
                  Sábados
                  <br />
                  <span className="text-ink">Con cita previa</span>
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
                  href={buildTelUrl(PRIMARY_PHONE.tel)}
                  className="text-sm hover:text-ink transition-colors"
                >
                  {PRIMARY_PHONE.display}
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
          <p>&copy; {new Date().getFullYear()} UCCI Propiedades. Todos los derechos reservados.</p>
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

function WhatsApp({ className }: { className?: string }) {
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
