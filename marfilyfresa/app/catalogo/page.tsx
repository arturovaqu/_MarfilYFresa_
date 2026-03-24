"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Heart, ShoppingBag, Search, X, Tag } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { useShop } from "@/context/shop-context"
import { createSupabaseBrowserClient } from "@/lib/supabase"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  is_featured: boolean | null
  is_on_sale: boolean | null
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [showOnSale, setShowOnSale] = useState(false)
  const [maxPriceFilter, setMaxPriceFilter] = useState(0)
  const [storeMaxPrice, setStoreMaxPrice] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { favorites, toggleFavorite, addToCart } = useShop()
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedProduct(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = selectedProduct ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [selectedProduct])

  async function fetchData() {
    setLoading(true)

    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("category").not("category", "is", null),
    ])

    const prodList = (prods ?? []) as Product[]
    setProducts(prodList)

    // Unique categories from DB
    const uniqueCats = Array.from(
      new Set((cats ?? []).map((r: { category: string | null }) => r.category).filter(Boolean) as string[])
    ).sort()
    setCategories(uniqueCats)

    const max = prodList.length > 0 ? Math.ceil(Math.max(...prodList.map((p) => Number(p.price)))) : 100
    setStoreMaxPrice(max)
    setMaxPriceFilter(max)
    setLoading(false)
  }

  async function handleToggleFavorite(productId: string, productName: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth?redirect=catalogo")
      return
    }
    toggleFavorite(productId, productName)
  }

  // Filter products
  const filtered = products.filter((p) => {
    if (activeCategory !== "Todos" && p.category !== activeCategory) return false
    if (showOnSale && !p.is_on_sale) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (Number(p.price) > maxPriceFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-4xl text-text-main">Catálogo</h1>
          <p className="text-text-soft text-sm mt-1">{filtered.length} productos</p>
        </div>

        {/* Search + filters row */}
        <div className="flex items-center gap-2 mb-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-soft pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-brown/20 bg-white pl-9 pr-4 py-2.5 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
            />
          </div>

          {/* En oferta toggle */}
          <button
            onClick={() => setShowOnSale(!showOnSale)}
            className={`flex-shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
              showOnSale
                ? "bg-terracota text-white"
                : "bg-white text-text-soft border border-brown/20 hover:border-terracota hover:text-text-main"
            }`}
          >
            En oferta
          </button>
        </div>

        {/* Category pills + price slider (single scrollable row) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          <button
            onClick={() => setActiveCategory("Todos")}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === "Todos"
                ? "bg-terracota text-white"
                : "bg-white text-text-soft border border-brown/20 hover:border-terracota hover:text-text-main"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-terracota text-white"
                  : "bg-white text-text-soft border border-brown/20 hover:border-terracota hover:text-text-main"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}

          {/* Divider + inline price slider */}
          {!loading && storeMaxPrice > 0 && (
            <div className="flex-shrink-0 flex items-center gap-2 border-l border-brown/20 pl-3">
              <span className="text-xs text-text-soft whitespace-nowrap">hasta {maxPriceFilter} €</span>
              <input
                type="range"
                min={0}
                max={storeMaxPrice}
                step={1}
                value={maxPriceFilter}
                onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                className="w-36 accent-terracota"
              />
            </div>
          )}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="font-serif text-xl text-text-main mb-2">No hay productos</p>
            <p className="text-text-soft text-sm">Prueba con otros filtros 🍓</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <article key={product.id} className="group relative">
                <div
                  className="relative aspect-square overflow-hidden rounded-2xl bg-white cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <Image
                    src={product.image_url ?? "/placeholder.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {product.is_featured && (
                    <span className="absolute left-3 top-3 rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                      Novedad
                    </span>
                  )}
                  {product.is_on_sale && !product.is_featured && (
                    <span className="absolute left-3 top-3 rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                      Oferta
                    </span>
                  )}

                  {/* Favorite button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(product.id, product.name) }}
                    className="absolute right-3 top-3 rounded-full bg-white/80 p-2 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        favorites.has(product.id) ? "fill-brown text-brown" : "text-text-soft"
                      }`}
                    />
                  </button>

                  {/* Add to cart overlay */}
                  <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: Number(product.price),
                          image: product.image_url ?? "/placeholder.jpg",
                          category: product.category,
                        })
                      }}
                      className="flex w-full items-center justify-center gap-2 bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Añadir
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <h3
                    className="font-serif text-base text-text-main cursor-pointer hover:text-terracota transition-colors"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-terracota">
                    {Number(product.price).toFixed(2)} €
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Product Modal */}
      {selectedProduct && (
        <div
          ref={overlayRef}
          onClick={(e) => { if (e.target === overlayRef.current) setSelectedProduct(null) }}
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-modal"
            style={{ animation: "modalIn 0.25s ease-out" }}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
            >
              <X className="h-5 w-5 text-text-main" />
            </button>

            {/* Image */}
            <div className="relative w-full aspect-square sm:aspect-[4/3] bg-cream">
              <Image
                src={selectedProduct.image_url ?? "/placeholder.jpg"}
                alt={selectedProduct.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 512px"
                priority
              />
              {/* Badges */}
              <div className="absolute left-4 top-4 flex gap-2">
                {selectedProduct.is_featured && (
                  <span className="rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                    Novedad
                  </span>
                )}
                {selectedProduct.is_on_sale && (
                  <span className="rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                    Oferta
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Category */}
              {selectedProduct.category && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Tag className="h-3.5 w-3.5 text-text-soft" />
                  <span className="rounded-full border border-brown/20 bg-cream px-3 py-0.5 text-xs text-text-soft capitalize">
                    {selectedProduct.category}
                  </span>
                </div>
              )}

              <h2 className="font-serif text-2xl text-text-main mb-1">{selectedProduct.name}</h2>
              <p className="text-xl font-medium text-terracota mb-4">
                {Number(selectedProduct.price).toFixed(2)} €
              </p>

              {selectedProduct.description && (
                <p className="text-sm text-text-soft leading-relaxed mb-6">
                  {selectedProduct.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    addToCart({
                      id: selectedProduct.id,
                      name: selectedProduct.name,
                      price: Number(selectedProduct.price),
                      image: selectedProduct.image_url ?? "/placeholder.jpg",
                      category: selectedProduct.category,
                    })
                    setSelectedProduct(null)
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Añadir al carrito
                </button>
                <button
                  onClick={() => handleToggleFavorite(selectedProduct.id, selectedProduct.name)}
                  className="rounded-full border border-brown/20 bg-cream p-3 hover:border-terracota transition-colors"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      favorites.has(selectedProduct.id) ? "fill-brown text-brown" : "text-text-soft"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
