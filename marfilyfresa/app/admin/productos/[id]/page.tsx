import { createSupabaseServerClient } from "@/lib/supabase-server"
import { notFound } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"

export default async function EditProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single()
  if (!product) notFound()

  return <ProductForm initialData={product} />
}
