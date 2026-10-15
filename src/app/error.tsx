"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { MessageCircle, RotateCcw } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { CONTACT_DEPARTMENTS, buildWhatsAppUrl } from "@/lib/constants";

const SALES_WHATSAPP = CONTACT_DEPARTMENTS.find((d) => d.id === "compra-venta")?.channels.find(
  (c) => c.kind === "whatsapp"
);

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="content-wrap flex min-h-[70vh] flex-col items-center justify-center pt-28 pb-16 text-center">
      <h1 className="text-3xl font-light text-ink sm:text-4xl">Algo salió mal</h1>
      <p className="mt-4 max-w-md text-ink/70">
        No pudimos cargar esta página. Probá de nuevo en unos segundos o escribinos y te
        ayudamos con tu búsqueda.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className={cn(buttonVariants(), "bg-brand text-black hover:bg-brand-dark hover:text-white")}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reintentar
        </button>
        {SALES_WHATSAPP?.kind === "whatsapp" && (
          <a
            href={buildWhatsAppUrl(SALES_WHATSAPP.waNumber, "Hola UCCI Propiedades, quería hacer una consulta.")}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Escribinos por WhatsApp
          </a>
        )}
        <Link href="/propiedades" className={buttonVariants({ variant: "ghost" })}>
          Ver propiedades
        </Link>
      </div>
    </div>
  );
}
