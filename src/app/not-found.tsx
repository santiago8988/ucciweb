import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="content-wrap flex min-h-[70vh] flex-col items-center justify-center pt-28 pb-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-ink/60">Error 404</p>
      <h1 className="mt-3 text-3xl font-light text-ink sm:text-4xl">
        No encontramos lo que buscabas
      </h1>
      <p className="mt-4 max-w-md text-ink/70">
        Puede que la propiedad ya no esté publicada o que el enlace haya cambiado. Te
        invitamos a ver las propiedades disponibles.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/propiedades"
          className={cn(buttonVariants(), "bg-brand text-black hover:bg-brand-dark hover:text-white")}
        >
          <Search className="mr-2 h-4 w-4" />
          Ver propiedades disponibles
        </Link>
        <Link href="/contacto" className={buttonVariants({ variant: "outline" })}>
          Contactanos
        </Link>
      </div>
    </div>
  );
}
