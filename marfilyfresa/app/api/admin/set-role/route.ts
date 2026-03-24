import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST(req: NextRequest) {
  try {
    // Verify caller is admin
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string | null } | null }

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const { userId, role } = (await req.json()) as { userId: string; role: string }

    if (!userId || !["user", "admin"].includes(role)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()
    const { error } = await admin.from("profiles").upsert({ id: userId, role })

    if (error) {
      console.error("Error updating role:", error)
      return NextResponse.json({ error: "Error al actualizar el rol" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Set role error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
