import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { product_id, product_name, customer_email } = body

  if (!product_name || !customer_email) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.from("stock_requests").insert({
    product_id: product_id ?? null,
    product_name: String(product_name),
    customer_email: String(customer_email).trim().toLowerCase(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
