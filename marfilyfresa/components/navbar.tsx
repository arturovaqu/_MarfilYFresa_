"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, ShoppingBag, Menu, X, Instagram, MessageCircle, LogOut, User } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { CartDrawer } from "@/components/cart-drawer"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const { favoritesCount, cartCount } = useShop()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  // Check auth on mount
  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email ?? "" } : null)
    })
    supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { email: session.user.email ?? "" } : null)
    })
  })

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/catalogo", label: "Catálogo" },
    { href: "/nosotros", label: "Nosotros" },
    { href: "/contacto", label: "Contacto" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50">
        <nav className="bg-cream shadow-sm border-b border-brown/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-1">
                <span className="font-serif text-xl text-text-main">MarfilFresa</span>
                <span className="text-sm">🍓</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex md:items-center md:gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-text-main transition-colors hover:text-terracota"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Right side icons */}
              <div className="flex items-center gap-1">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block p-2 text-text-main transition-colors hover:text-terracota"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/34612345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block p-2 text-text-main transition-colors hover:text-terracota"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>

                {/* Favorites */}
                <Link
                  href="/favoritos"
                  className="relative p-2 text-text-main transition-colors hover:text-terracota"
                  aria-label={`Favoritos (${favoritesCount})`}
                >
                  <Heart className="h-5 w-5" />
                  {favoritesCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracota text-xs font-medium text-white">
                      {favoritesCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 text-text-main transition-colors hover:text-terracota"
                  aria-label={`Carrito (${cartCount})`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracota text-xs font-medium text-white">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Auth */}
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="p-2 text-text-main transition-colors hover:text-terracota"
                    title={`Cerrar sesión (${user.email})`}
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                ) : (
                  <Link
                    href="/auth"
                    className="p-2 text-text-main transition-colors hover:text-terracota"
                    aria-label="Iniciar sesión"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                )}

                {/* Mobile Menu */}
                <button
                  className="p-2 text-text-main md:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="border-t border-brown/10 bg-cream md:hidden">
              <div className="space-y-1 px-4 pb-4 pt-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-base font-medium text-text-main transition-colors hover:bg-terracota/10"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
