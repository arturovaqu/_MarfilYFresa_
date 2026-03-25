import { createSupabaseServerClient } from "@/lib/supabase-server"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const supabase = await createSupabaseServerClient()

  const [{ data: featuredProducts }, { data: saleProducts }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("products")
      .select("*")
      .eq("is_on_sale", true)
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  return (
    <HomeClient
      products={featuredProducts ?? []}
      saleProducts={saleProducts ?? []}
    />
  )
}
