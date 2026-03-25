"use client"

import Image from "next/image"
import Link from "next/link"

export function Hero() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="inicio" className="relative min-h-[90vh] bg-cream overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-terracota/20 blur-3xl" />
        <div className="absolute top-40 right-20 w-24 h-24 rounded-full bg-terracota/30 blur-2xl" />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-terracota/15 blur-3xl" />
        <div className="absolute bottom-20 right-1/3 w-20 h-20 rounded-full bg-brown/20 blur-2xl" />

        {/* Subtle dots pattern */}
        <div className="absolute top-1/4 right-10 w-2 h-2 rounded-full bg-terracota/40" />
        <div className="absolute top-1/3 right-24 w-3 h-3 rounded-full bg-terracota/30" />
        <div className="absolute top-1/2 left-16 w-2 h-2 rounded-full bg-brown/40" />
        <div className="absolute bottom-1/4 right-16 w-2 h-2 rounded-full bg-terracota/50" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[90vh] flex-col items-center justify-center text-center">
          {/* Logo */}
          <Image
            src="/logo.svg"
            alt="MarfilYFresa"
            width={280}
            height={105}
            priority
            className="mb-10"
          />

          {/* Buttons */}
          <div className="flex flex-row items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => scrollTo("novedades")}
              className="inline-flex items-center justify-center rounded-full bg-terracota px-7 py-3.5 text-base font-medium text-white transition-all hover:bg-brown hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brown focus:ring-offset-2 focus:ring-offset-cream"
            >
              Novedades
            </button>
            <button
              onClick={() => scrollTo("ofertas")}
              className="inline-flex items-center justify-center rounded-full bg-terracota px-7 py-3.5 text-base font-medium text-white transition-all hover:bg-brown hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brown focus:ring-offset-2 focus:ring-offset-cream"
            >
              Ofertas
            </button>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-full bg-terracota px-7 py-3.5 text-base font-medium text-white transition-all hover:bg-brown hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brown focus:ring-offset-2 focus:ring-offset-cream"
            >
              Ver catálogo
            </Link>
          </div>

          <p className="mt-6 text-sm text-text-soft text-center">
            Joyas de acero inoxidable y plata · Desde 2021
          </p>
        </div>
      </div>
    </section>
  )
}
