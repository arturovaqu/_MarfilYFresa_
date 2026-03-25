"use client"

import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { NewProducts } from "@/components/new-products"
import { Footer } from "@/components/footer"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock: number | null
  is_featured: boolean | null
  is_on_sale: boolean | null
  category: string | null
}

export function HomeClient({ products }: { products: Product[] }) {
  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    image: p.image_url ?? "/placeholder.jpg",
    stock: p.stock ?? null,
    isNew: p.is_featured ?? false,
    isOnSale: p.is_on_sale ?? false,
    category: p.category,
  }))

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <NewProducts products={formattedProducts} />
      <Footer />
    </main>
  )
}
