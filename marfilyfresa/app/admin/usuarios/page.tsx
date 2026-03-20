import { createSupabaseServerClient } import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function AdminUsuariosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/")

  // Get users via admin API
  const { data: { users } } = await supabase.auth.admin.listUsers()

  // Get wishlist counts per user
  const { data: wishlistCounts } = await supabase
    .from("wishlist")
    .select("user_id")

  const wishlistByUser: Record<string, number> = {}
  wishlistCounts?.forEach((w) => {
    wishlistByUser[w.user_id] = (wishlistByUser[w.user_id] ?? 0) + 1
  })

  // Get order counts per user
  const { data: orderCounts } = await supabase
    .from("orders")
    .select("user_id")

  const ordersByUser: Record<string, number> = {}
  orderCounts?.forEach((o) => {
    ordersByUser[o.user_id] = (ordersByUser[o.user_id] ?? 0) + 1
  })

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-brown text-cream px-6 py-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-cream/70 hover:text-cream transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
        <span className="font-serif text-lg">Usuarias</span>
        <div />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-text-soft text-sm mb-6">{users.length} usuarias registradas</p>

        <div className="rounded-2xl bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-cream/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Registrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Favoritos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Pedidos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-cream/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-text-main">{u.email}</td>
                  <td className="px-6 py-4 text-sm text-text-soft">
                    {new Date(u.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-soft">
                    {wishlistByUser[u.id] ?? 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-soft">
                    {ordersByUser[u.id] ?? 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      u.email === process.env.ADMIN_EMAIL
                        ? "bg-terracota/10 text-terracota"
                        : "bg-brown/10 text-brown"
                    }`}>
                      {u.email === process.env.ADMIN_EMAIL ? "Admin" : "Usuaria"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
