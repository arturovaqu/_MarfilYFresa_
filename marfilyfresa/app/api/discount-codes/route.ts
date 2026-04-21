import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  // Verify admin
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const admin = createSupabaseAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const body = await req.json()
  const { code, starts_at, ends_at, product_ids, discount_type, discount_value } = body

  if (!code || !starts_at || !ends_at || !discount_type || discount_value == null) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
  }
  if (!["percentage", "fixed"].includes(discount_type)) {
    return NextResponse.json({ error: "Tipo de descuento inválido" }, { status: 400 })
  }
  if (discount_value <= 0) {
    return NextResponse.json({ error: "El valor debe ser mayor que 0" }, { status: 400 })
  }
  if (discount_type === "percentage" && discount_value > 100) {
    return NextResponse.json({ error: "El porcentaje no puede superar 100" }, { status: 400 })
  }
  if (new Date(ends_at) <= new Date(starts_at)) {
    return NextResponse.json({ error: "La fecha de fin debe ser posterior a la de inicio" }, { status: 400 })
  }

  const { data, error } = await admin
    .from("discount_codes")
    .insert({
      code: String(code).toUpperCase().trim(),
      starts_at,
      ends_at,
      product_ids: product_ids ?? [],
      discount_type,
      discount_value,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un código con ese nombre" }, { status: 409 })
    }
    return NextResponse.json({ error: "Error al crear el código" }, { status: 500 })
  }

  return NextResponse.json({ code: data }, { status: 201 })
}
