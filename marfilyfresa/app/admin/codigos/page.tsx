import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { DiscountCodesManager } from "@/components/admin/discount-codes-manager"

export default async function AdminCodigosPage() {
  const admin = createSupabaseAdminClient()

  const [{ data: codes }, { data: products }] = await Promise.all([
    admin
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false }),
    admin
      .from("products")
      .select("id, name")
      .order("name", { ascending: true }),
  ])

  return (
    <DiscountCodesManager
      initialCodes={codes ?? []}
      products={products ?? []}
    />
  )
}
