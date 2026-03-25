import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseServerClient } from "@/lib/supabase-server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import ProductDetailClient from "./product-detail-client"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: product } = await supabase
    .from("products")
    .select("name, description, image_url")
    .eq("id", id)
    .single()

  if (!product) {
    return { title: "Producto no encontrado | MarfilYFresa" }
  }

  const title = `${product.name} | MarfilYFresa`
  const description =
    product.description ??
    `${product.name} — Joyería colorida y divertida de MarfilYFresa.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image_url ? [{ url: product.image_url }] : [],
    },
  }
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (!product) notFound()

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <ProductDetailClient product={product} />
      <Footer />
    </div>
  )
}
