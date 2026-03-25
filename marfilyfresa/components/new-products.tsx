"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag, X, Tag, Link2, Check, BellRing } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { StockRequestModal } from "@/components/stock-request-modal"

interface Product {
  id: string
  name: string
  description?: string | null
  price: number
  image: string
  stock: number | null
  isNew?: boolean
  isOnSale?: boolean
  category?: string | null
}

export function NewProducts({ products }: { products: Product[] }) {
  const { favorites, toggleFavorite, addToCart } = useShop()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [copied, setCopied] = useState(false)
  const [stockRequestProduct, setStockRequestProduct] = useState<{
    id: string
    name: string
  } | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  async function handleToggleFavorite(productId: string, productName: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth?redirect=/")
      return
    }
    toggleFavorite(productId, productName)
  }

  function openModal(product: Product) {
    setSelectedProduct(product)
    window.history.replaceState(null, "", `/producto/${product.id}`)
  }

  function closeModal() {
    setSelectedProduct(null)
    setCopied(false)
    window.history.replaceState(null, "", "/")
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [selectedProduct])

  if (products.length === 0) {
    return (
      <section id="catalogo" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-serif text-3xl text-text-main text-center mb-4">
            Lo nuevo 🌸
          </h2>
          <p className="text-center text-text-soft text-sm">
            ¡Pronto habrá novedades!
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section id="catalogo" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-serif text-3xl text-text-main text-center mb-10">
            Lo nuevo 🌸
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const isOutOfStock =
                product.stock === null || product.stock <= 0
              return (
                <article key={product.id} className="group relative">
                  <div
                    className="relative aspect-square overflow-hidden rounded-2xl bg-white cursor-pointer"
                    onClick={() => openModal(product)}
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className={`object-cover transition-transform duration-300 group-hover:scale-105${
                        isOutOfStock ? " grayscale" : ""
                      }`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/20 pointer-events-none" />
                    )}

                    {isOutOfStock ? (
                      <span className="absolute left-3 top-3 rounded-full bg-brown/80 px-3 py-1 text-xs font-medium text-white">
                        Agotado
                      </span>
                    ) : (
                      <>
                        {product.isNew && (
                          <span className="absolute left-3 top-3 rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                            Novedad
                          </span>
                        )}
                        {product.isOnSale && !product.isNew && (
                          <span className="absolute left-3 top-3 rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                            Oferta
                          </span>
                        )}
                      </>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(product.id, product.name)
                      }}
                      className="absolute right-3 top-3 rounded-full bg-white/80 p-2 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          favorites.has(product.id)
                            ? "fill-brown text-brown"
                            : "text-text-soft"
                        }`}
                      />
                    </button>

                    {/* Cart / aviso overlay */}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
                      {isOutOfStock ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setStockRequestProduct({
                              id: product.id,
                              name: product.name,
                            })
                          }}
                          className="flex w-full items-center justify-center gap-2 bg-white/95 py-3 text-sm font-medium text-brown hover:bg-white transition-colors"
                        >
                          <BellRing className="h-4 w-4" />
                          Solicitar aviso
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart({
                              id: product.id,
                              name: product.name,
                              price: product.price,
                              image: product.image,
                              category: product.category,
                            })
                          }}
                          className="flex w-full items-center justify-center gap-2 bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Añadir
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 text-center">
                    <h3
                      className="font-serif text-base text-text-main cursor-pointer hover:text-terracota transition-colors"
                      onClick={() => openModal(product)}
                    >
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-terracota">
                      {product.price.toFixed(2)} €
                    </p>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/catalogo"
              className="inline-block rounded-full border-2 border-brown/20 px-8 py-3 text-sm font-medium text-text-main hover:border-terracota hover:text-terracota transition-colors"
            >
              Ver todo el catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* Product Modal */}
      {selectedProduct && (() => {
        const isOutOfStock =
          selectedProduct.stock === null || selectedProduct.stock <= 0
        return (
          <div
            ref={overlayRef}
            onClick={(e) => {
              if (e.target === overlayRef.current) closeModal()
            }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
              style={{ animation: "modalIn 0.25s ease-out" }}
            >
              {/* Share button */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/producto/${selectedProduct.id}`
                  navigator.clipboard.writeText(url).catch(() => {})
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="absolute right-14 top-4 z-10 rounded-full bg-white/80 p-2 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
                title="Copiar enlace"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-terracota" />
                ) : (
                  <Link2 className="h-4 w-4 text-text-main" />
                )}
              </button>

              {/* Close button */}
              <button
                onClick={() => closeModal()}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
              >
                <X className="h-5 w-5 text-text-main" />
              </button>

              {/* Image */}
              <div className="relative w-full aspect-square sm:aspect-[4/3] bg-cream">
                <Image
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  fill
                  className={`object-cover${isOutOfStock ? " grayscale" : ""}`}
                  sizes="(max-width: 640px) 100vw, 512px"
                  priority
                />
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-white/20 pointer-events-none" />
                )}
                <div className="absolute left-4 top-4 flex gap-2">
                  {isOutOfStock ? (
                    <span className="rounded-full bg-brown/80 px-3 py-1 text-xs font-medium text-white">
                      Agotado
                    </span>
                  ) : (
                    <>
                      {selectedProduct.isNew && (
                        <span className="rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                          Novedad
                        </span>
                      )}
                      {selectedProduct.isOnSale && (
                        <span className="rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                          Oferta
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {selectedProduct.category && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Tag className="h-3.5 w-3.5 text-text-soft" />
                    <span className="rounded-full border border-brown/20 bg-cream px-3 py-0.5 text-xs text-text-soft capitalize">
                      {selectedProduct.category}
                    </span>
                  </div>
                )}

                <h2 className="font-serif text-2xl text-text-main mb-1">
                  {selectedProduct.name}
                </h2>
                <p className="text-xl font-medium text-terracota mb-4">
                  {selectedProduct.price.toFixed(2)} €
                </p>

                {selectedProduct.description && (
                  <p className="text-sm text-text-soft leading-relaxed mb-6">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="flex gap-3">
                  {isOutOfStock ? (
                    <button
                      onClick={() => {
                        setStockRequestProduct({
                          id: selectedProduct.id,
                          name: selectedProduct.name,
                        })
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-brown/30 py-3 text-sm font-medium text-brown hover:border-brown hover:text-text-main transition-colors"
                    >
                      <BellRing className="h-4 w-4" />
                      Solicitar aviso
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        addToCart({
                          id: selectedProduct.id,
                          name: selectedProduct.name,
                          price: selectedProduct.price,
                          image: selectedProduct.image,
                          category: selectedProduct.category,
                        })
                        closeModal()
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Añadir al carrito
                    </button>
                  )}
                  <button
                    onClick={() =>
                      handleToggleFavorite(
                        selectedProduct.id,
                        selectedProduct.name
                      )
                    }
                    className="rounded-full border border-brown/20 bg-cream p-3 hover:border-terracota transition-colors"
                  >
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        favorites.has(selectedProduct.id)
                          ? "fill-brown text-brown"
                          : "text-text-soft"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {stockRequestProduct && (
        <StockRequestModal
          productId={stockRequestProduct.id}
          productName={stockRequestProduct.name}
          onClose={() => setStockRequestProduct(null)}
        />
      )}

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
