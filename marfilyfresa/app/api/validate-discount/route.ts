import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"

interface CartItem {
  id: string
  price: number
  quantity: number
}

export async function POST(req: NextRequest) {
  const { code, items } = (await req.json()) as {
    code: string
    items: CartItem[]
  }

  if (!code?.trim() || !items?.length) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()

  const { data: dc } = await admin
    .from("discount_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single()

  if (!dc) {
    return NextResponse.json({ error: "Código no encontrado" }, { status: 404 })
  }

  const now = new Date()
  if (now < new Date(dc.starts_at)) {
    return NextResponse.json({ error: "Este código aún no está activo" }, { status: 400 })
  }
  if (now > new Date(dc.ends_at)) {
    return NextResponse.json({ error: "Este código ha caducado" }, { status: 400 })
  }

  // Calculate discount
  let originalTotal = 0
  let discountedTotal = 0

  for (const item of items) {
    const eligible =
      dc.product_ids.length === 0 || dc.product_ids.includes(item.id)

    let effectivePrice = item.price
    if (eligible) {
      if (dc.discount_type === "percentage") {
        effectivePrice = item.price * (1 - dc.discount_value / 100)
      } else {
        // fixed: the item costs dc.discount_value (capped to original price)
        effectivePrice = Math.min(dc.discount_value, item.price)
      }
    }

    originalTotal += item.price * item.quantity
    discountedTotal += effectivePrice * item.quantity
  }

  const discountAmount = originalTotal - discountedTotal

  return NextResponse.json({
    valid: true,
    discountType: dc.discount_type,
    discountValue: dc.discount_value,
    productIds: dc.product_ids,
    originalTotal: Math.round(originalTotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    finalTotal: Math.round(discountedTotal * 100) / 100,
  })
}
