"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingBag, ArrowLeft, Link2, Check, Tag, BellRing } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { StockRequestModal } from "@/components/stock-request-modal"

interface ProductRow {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock: number | null
  category: string | null
  is_featured: boolean | null
  is_on_sale: boolean | null
}

export default function ProductDetailClient({ product }: { product: ProductRow }) {
  const [copied, setCopied] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const { favorites, toggleFavorite, addToCart } = useShop()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const outOfStock = product.stock !== null && product.stock <= 0

  async function handleToggleFavorite() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth?redirect=/producto/" + product.id)
      return
    }
    toggleFavorite(product.id, product.name)
  }

  async function handleShare() {
    const url = `${window.location.origin}/producto/${product.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // clipboard not available in some contexts
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/catalogo"
          className="flex items-center gap-2 text-sm text-text-soft transition-colors hover:text-text-main"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-full border border-brown/20 px-4 py-2 text-sm text-text-soft transition-all hover:border-terracota hover:text-terracota"
        >
          {copied ? (
            <Check className="h-4 w-4 text-terracota" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {copied ? "¡Copiado!" : "Compartir"}
        </button>
      </div>

      {/* Image */}
      <div className="relative mb-6 aspect-square w-full overflow-hidden rounded-3xl bg-white sm:aspect-[4/3]">
        <Image
          src={product.image_url ?? "/placeholder.jpg"}
          alt={product.name}
          fill
          className={`object-cover transition-all${outOfStock ? " grayscale" : ""}`}
          sizes="(max-width: 640px) 100vw, 672px"
          priority
        />
        <div className="absolute left-4 top-4 flex gap-2">
          {outOfStock && (
            <span className="rounded-full bg-brown/80 px-3 py-1 text-xs font-medium text-white">
              Agotado
            </span>
          )}
          {!outOfStock && product.is_featured && (
            <span className="rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
              Novedad
            </span>
          )}
          {product.is_on_sale && (
            <span className="rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
              Oferta
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        {product.category && (
          <div className="mb-3 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-text-soft" />
            <span className="rounded-full border border-brown/20 bg-cream px-3 py-0.5 text-xs capitalize text-text-soft">
              {product.category}
            </span>
          </div>
        )}

        <h1 className="mb-2 font-serif text-3xl text-text-main">{product.name}</h1>
        <p className="mb-4 text-2xl font-medium text-terracota">
          {Number(product.price).toFixed(2)} €
        </p>

        {product.description && (
          <p className="mb-8 text-sm leading-relaxed text-text-soft">
            {product.description}
          </p>
        )}

        <div className="flex gap-3">
          {outOfStock ? (
            <button
              onClick={() => setShowStockModal(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-brown/30 py-3.5 text-sm font-medium text-brown transition-colors hover:border-brown hover:text-text-main"
            >
              <BellRing className="h-4 w-4" />
              Solicitar aviso
            </button>
          ) : (
            <button
              onClick={() =>
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  image: product.image_url ?? "/placeholder.jpg",
                  category: product.category,
                })
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-terracota py-3.5 text-sm font-medium text-white transition-colors hover:bg-brown"
            >
              <ShoppingBag className="h-4 w-4" />
              Añadir al carrito
            </button>
          )}
          <button
            onClick={handleToggleFavorite}
            className="rounded-full border border-brown/20 bg-cream p-3.5 transition-colors hover:border-terracota"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                favorites.has(product.id) ? "fill-brown text-brown" : "text-text-soft"
              }`}
            />
          </button>
        </div>
      </div>
    </main>

    {showStockModal && (
      <StockRequestModal
        productId={product.id}
        productName={product.name}
        onClose={() => setShowStockModal(false)}
      />
    )}
    </>
  )
}
