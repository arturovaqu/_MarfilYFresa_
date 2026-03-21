"use client"

import Image from "next/image"
import { Heart, ShoppingBag, Trash2 } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface WishlistItem {
  id: string
  product_id: string | null
  product_name: string
  created_at: string
  products: {
    id: string
    name: string
    price: number
    image_url: string | null
    is_featured: boolean | null
    is_on_sale: boolean | null
    category: string | null
  } | null
}

export function FavoritesClient({ items }: { items: WishlistItem[] }) {
  const { addToCart } = useShop()
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  async function removeFromFavorites(wishlistId: string) {
    await supabase.from("wishlist").delete().eq("id", wishlistId)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const product = item.products
        if (!product) return null

        return (
          <article key={item.id} className="group relative">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white">
              <Image
                src={product.image_url ?? "/placeholder.jpg"}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {product.is_on_sale && (
                <span className="absolute left-3 top-3 rounded-full bg-terracota px-3 py-1 text-xs font-medium text-white">
                  Oferta
                </span>
              )}

              {/* Remove from favorites */}
              <button
                onClick={() => removeFromFavorites(item.id)}
                className="absolute right-3 top-3 rounded-full bg-white/80 p-2 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                aria-label="Quitar de favoritos"
              >
                <Heart className="h-5 w-5 fill-brown text-brown" />
              </button>

              {/* Add to cart overlay */}
              <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
                <button
                  onClick={() => addToCart({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    image: product.image_url ?? "/placeholder.jpg",
                    category: product.category,
                  })}
                  className="flex w-full items-center justify-center gap-2 bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Añadir al carrito
                </button>
              </div>
            </div>

            <div className="mt-3 text-center">
              <h3 className="font-serif text-base text-text-main">{product.name}</h3>
              <p className="mt-1 text-sm font-medium text-terracota">
                {Number(product.price).toFixed(2)} €
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
