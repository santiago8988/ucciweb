import type { Metadata } from "next";
import { OFFICE, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  alternates: { canonical: "/privacidad" },
  title: "Política de privacidad",
  description: `Cómo ${SITE_NAME} trata los datos de quienes visitan este sitio.`,
};

// Base text: to be reviewed by the client's legal advisor before launch.
export default function PrivacidadPage() {
  return (
    <div className="content-wrap max-w-3xl pt-32 pb-20">
      <h1 className="text-3xl font-light text-ink sm:text-4xl">Política de privacidad</h1>
      <div className="mt-8 space-y-6 leading-relaxed text-ink/80">
        <section>
          <h2 className="text-lg font-semibold text-ink">Responsable</h2>
          <p className="mt-2">
            {SITE_NAME} (Atilio Ucci e Hijos Propiedades), {OFFICE.address}, {OFFICE.city}.
            Contacto: <a className="underline" href={`mailto:${OFFICE.email}`}>{OFFICE.email}</a>.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Qué datos recolectamos</h2>
          <p className="mt-2">
            Este sitio no tiene formularios ni requiere registro. Las propiedades que marcás
            como favoritas se guardan solamente en tu navegador. Si nos contactás por
            WhatsApp o teléfono, usamos los datos que nos compartas únicamente para
            responder tu consulta.
          </p>
          <p className="mt-2">
            Usamos Google Analytics para conocer de forma agregada cómo se usa el sitio
            (páginas visitadas y clics en los botones de contacto). Esta herramienta puede
            usar cookies; la dirección IP se anonimiza.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-ink">Tus derechos</h2>
          <p className="mt-2">
            Podés solicitar el acceso, la rectificación o la supresión de tus datos
            escribiendo a {OFFICE.email}, conforme a la Ley 25.326 de Protección de Datos
            Personales. La Agencia de Acceso a la Información Pública, órgano de control de
            la Ley 25.326, atiende las denuncias y reclamos por incumplimiento de las normas
            sobre protección de datos personales.
          </p>
        </section>
      </div>
    </div>
  );
}
