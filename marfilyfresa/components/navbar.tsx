"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Heart, ShoppingBag, Menu, X, Instagram, MessageCircle, User, ChevronDown } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { CartDrawer } from "@/components/cart-drawer"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const { favoritesCount, cartCount } = useShop()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email ?? "" } : null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ? { email: session.user.email ?? "" } : null)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleLogout() {
    setIsProfileOpen(false)
    await supabase.auth.signOut()
    router.push("/")
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
              <Link href="/" className="flex items-center">
                <Image src="/logo.svg" alt="MarfilYFresa" width={120} height={45} priority />
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
                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block p-2 text-text-main transition-colors hover:text-terracota"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/34612345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:block p-2 text-text-main transition-colors hover:text-terracota"
                  aria-label="WhatsApp"
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

                {/* Profile */}
                {user ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-1 p-2 text-text-main transition-colors hover:text-terracota"
                      aria-label="Mi cuenta"
                    >
                      <User className="h-5 w-5" />
                      <ChevronDown className={`h-3 w-3 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-2xl bg-white shadow-lg border border-brown/10 overflow-hidden z-50">
                        <div className="px-4 py-2 border-b border-brown/10">
                          <p className="text-xs text-text-soft truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/favoritos"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-text-main hover:bg-terracota/10 transition-colors"
                        >
                          <Heart className="h-4 w-4 text-terracota" />
                          Mi cuenta
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-text-main hover:bg-terracota/10 transition-colors"
                        >
                          <X className="h-4 w-4 text-text-soft" />
                          Cerrar sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="p-2 text-text-main transition-colors hover:text-terracota"
                    aria-label="Iniciar sesión"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                )}

                {/* Mobile menu toggle */}
                <button
                  className="p-2 text-text-main md:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Menú"
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
                <div className="pt-2 border-t border-brown/10 mt-2">
                  {user ? (
                    <>
                      <Link
                        href="/favoritos"
                        onClick={() => setIsMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-base font-medium text-text-main hover:bg-terracota/10 transition-colors"
                      >
                        Mi cuenta
                      </Link>
                      <button
                        onClick={() => { setIsMenuOpen(false); handleLogout() }}
                        className="block w-full text-left rounded-lg px-3 py-2 text-base font-medium text-text-main hover:bg-terracota/10 transition-colors"
                      >
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/auth"
                      onClick={() => setIsMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-base font-medium text-terracota hover:bg-terracota/10 transition-colors"
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
