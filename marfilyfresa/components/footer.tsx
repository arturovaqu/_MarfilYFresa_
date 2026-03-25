"use client"

import Link from "next/link"
import { Instagram, MessageCircle } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { href: "/", label: "Inicio" },
    { href: "/catalogo", label: "Catálogo" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/contacto", label: "Contacto" },
  ]

  const socialLinks = [
    { href: "https://instagram.com", label: "Instagram", icon: Instagram },
    { href: "https://wa.me/34644065770", label: "WhatsApp", icon: MessageCircle },
  ]

  return (
    <footer className="bg-brown py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <Link href="/" className="flex items-center gap-1">
              <span className="font-serif text-xl text-cream">MarfilFresa</span>
              <span className="text-sm">🍓</span>
            </Link>
            <p className="text-xs text-cream/60">Desde 2021 · Joyas de acero inoxidable y plata</p>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-cream/80 transition-colors hover:text-cream"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-cream/10 p-2 text-cream transition-all hover:bg-cream/20 hover:scale-110"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-cream/10 pt-6 text-center">
          <p className="text-xs text-cream/60">
            © {currentYear} MarfilYFresa. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
