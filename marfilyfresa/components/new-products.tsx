"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase"

interface Product {
  id: string
  name: string
  price: number
  image: string
  isNew?: boolean
  isOnSale?: boolean
  category?: string | null
}

export function NewProducts({ products }: { products: Product[] }) {
  const { favorites, toggleFavorite, addToCart } = useShop()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleToggleFavorite(productId: string, productName: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth?redirect=/")
      return
    }
    toggleFavorite(productId, productName)
  }

  if (products.length === 0) {
    return (
      <section id="catalogo" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-serif text-3xl text-text-main text-center mb-4">Lo nuevo 🌸</h2>
          <p className="text-center text-text-soft text-sm">¡Pronto habrá novedades!</p>
        </div>
      </section>
    )
  }

  return (
    <section id="catalogo" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-serif text-3xl text-text-main text-center mb-10">Lo nuevo 🌸</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <article key={product.id} className="group relative">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

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

                <button
                  onClick={() => handleToggleFavorite(product.id, product.name)}
                  className="absolute right-3 top-3 rounded-full bg-white/80 p-2 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      favorites.has(product.id) ? "fill-brown text-brown" : "text-text-soft"
                    }`}
                  />
                </button>

                <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
                  <button
                    onClick={() => addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.image,
                      category: product.category,
                    })}
                    className="flex w-full items-center justify-center gap-2 bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Añadir
                  </button>
                </div>
              </div>

              <div className="mt-3 text-center">
                <h3 className="font-serif text-base text-text-main">{product.name}</h3>
                <p className="mt-1 text-sm font-medium text-terracota">{product.price.toFixed(2)} €</p>
              </div>
            </article>
          ))}
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
  )
}
