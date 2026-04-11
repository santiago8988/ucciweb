"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Home, Shield, TrendingUp, Search, Users, Award } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

const SERVICES = [
  {
    icon: Search,
    title: "Búsqueda personalizada",
    description: "Te ayudamos a encontrar la propiedad que se ajuste a tus necesidades y presupuesto.",
  },
  {
    icon: TrendingUp,
    title: "Tasación profesional",
    description: "Valuación precisa de tu propiedad basada en datos del mercado actual.",
  },
  {
    icon: Shield,
    title: "Asesoramiento legal",
    description: "Te acompañamos en cada paso del proceso con total transparencia y seguridad.",
  },
  {
    icon: Users,
    title: "Atención personalizada",
    description: "Un agente dedicado que entiende tus objetivos y trabaja para cumplirlos.",
  },
];

export function CTASection() {
  return (
    <>
      {/* Services — Knight Frank / Savills style */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-brand mb-2">
              Nuestros servicios
            </p>
            <h2 className="text-3xl font-light text-gray-900 sm:text-4xl lg:text-5xl">
              ¿Cómo podemos ayudarte?
            </h2>
            <div className="mt-4 h-px bg-gradient-to-r from-brand/40 to-transparent max-w-xs" />
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative rounded-xl border border-gray-100 bg-white p-7 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-softer"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-soft transition-colors group-hover:bg-brand">
                  <service.icon className="h-6 w-6 text-brand-dark transition-colors group-hover:text-ink" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner — Compass style gradient */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-ink p-12 md:p-20"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand/10 to-transparent" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-brand/5" />

            <div className="relative z-10 max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand mb-4">
                Vendé o alquilá con nosotros
              </p>
              <h2 className="text-3xl font-light text-white sm:text-4xl lg:text-5xl leading-tight">
                Maximizá el valor de tu propiedad
              </h2>
              <p className="mt-5 text-lg text-white/60 font-light leading-relaxed">
                Nuestro equipo de profesionales te asesora para lograr la mejor operación.
                Tasación gratuita y sin compromiso.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contacto"
                  className={cn(buttonVariants({ size: "lg" }), "bg-brand text-ink hover:bg-brand-dark hover:text-white px-8 h-12 text-base font-semibold")}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Contactanos
                </Link>
                <Link
                  href="/propiedades"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white px-8 h-12 text-base")}
                >
                  Ver propiedades
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
