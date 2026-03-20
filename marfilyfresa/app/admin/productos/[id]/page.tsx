import { createSupabaseServerClient } import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect, notFound } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"

export default async function EditProductoPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/")

  const { data: product } = await supabase.from("products").select("*").eq("id", params.id).single()
  if (!product) notFound()

  return <ProductForm initialData={product} />
}
