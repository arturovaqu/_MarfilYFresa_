import { createSupabaseServerClient } import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FavoritesClient } from "@/components/favorites-client"

export default async function FavoritosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth?redirect=favoritos")
  }

  // Fetch wishlist with product data
  const { data: wishlistItems } = await supabase
    .from("wishlist")
    .select(`
      id,
      product_id,
      product_name,
      created_at,
      products (
        id,
        name,
        price,
        image_url,
        is_featured,
        is_on_sale,
        category
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-7 w-7 text-terracota fill-terracota" />
          <h1 className="font-serif text-3xl text-text-main">Tus favoritos</h1>
        </div>

        {!wishlistItems || wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart className="h-16 w-16 text-terracota/30 mb-4" />
            <p className="font-serif text-xl text-text-main mb-2">Aún no tienes favoritos</p>
            <p className="text-text-soft text-sm mb-8">
              Guarda las piezas que más te gusten para encontrarlas fácilmente 🍓
            </p>
            <Link
              href="/catalogo"
              className="rounded-full bg-terracota px-8 py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <FavoritesClient items={wishlistItems} />
        )}
      </main>
      <Footer />
    </div>
  )
}
