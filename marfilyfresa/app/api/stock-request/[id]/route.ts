import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { notified } = body

  if (typeof notified !== "boolean") {
    return NextResponse.json({ error: "Campo notified inválido" }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  const { error } = await supabase
    .from("stock_requests")
    .update({ notified })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
