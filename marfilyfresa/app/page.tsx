import { createSupabaseServerClient } from "@/lib/supabase-server"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const supabase = await createSupabaseServerClient()

  // Fetch featured products from Supabase
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8)

  return <HomeClient products={products ?? []} />
}
