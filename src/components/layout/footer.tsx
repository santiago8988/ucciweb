import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
  Instagram,
  Facebook,
  MessageCircle,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  OFFICE,
  CONTACT_DEPARTMENTS,
  buildTelUrl,
  buildWhatsAppUrl,
} from "@/lib/constants";

const QUICK_LINKS = [
  { href: "/propiedades?operacion=venta", label: "Propiedades en venta" },
  { href: "/propiedades?operacion=alquiler", label: "Propiedades en alquiler" },
  { href: "/propiedades?tipo=casa", label: "Casas" },
  { href: "/propiedades?tipo=departamento", label: "Departamentos" },
  { href: "/propiedades?tipo=terreno", label: "Terrenos" },
];

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

// First WhatsApp from "Compra / Venta" department
const primaryWhatsApp = CONTACT_DEPARTMENTS[2].channels.find(
  (c) => c.kind === "whatsapp"
);

export function Footer() {
  return (
    <footer className="bg-ink text-white/70">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 py-16 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex mb-5">
              <span className="rounded-xl bg-brand p-2">
                <Image
                  src="/logo-ucci.svg"
                  alt="UCCI Propiedades"
                  width={140}
                  height={60}
                  className="h-10 w-auto"
                />
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/50">
              Más de 50 años acompañando a los marplatenses en la búsqueda de su
              próximo hogar o inversión.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialIcon href={OFFICE.instagram} icon={Instagram} label="Instagram" />
              <SocialIcon href={OFFICE.facebook} icon={Facebook} label="Facebook" />
              {primaryWhatsApp && primaryWhatsApp.kind === "whatsapp" && (
                <SocialIcon
                  href={buildWhatsAppUrl(primaryWhatsApp.waNumber)}
                  icon={MessageCircle}
                  label="WhatsApp"
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-brand">
              Navegación
            </h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick property links */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-brand">
              Propiedades
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-brand">
              Contacto
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-brand flex-shrink-0" />
                <span className="text-sm">
                  {OFFICE.address}
                  <br />
                  <span className="text-white/50">{OFFICE.city}</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-brand flex-shrink-0" />
                <a
                  href={buildTelUrl(OFFICE.mainPhone.tel)}
                  className="text-sm hover:text-white transition-colors"
                >
                  {OFFICE.mainPhone.display}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-brand flex-shrink-0" />
                <a
                  href={`mailto:${OFFICE.email}`}
                  className="text-sm hover:text-white transition-colors break-all"
                >
                  {OFFICE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-4 py-6 text-xs text-white/40 md:flex-row">
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
      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:bg-brand hover:text-ink hover:border-brand"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}
