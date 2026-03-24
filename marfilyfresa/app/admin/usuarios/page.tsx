import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { RoleSelect } from "@/components/admin/role-select"

export default async function AdminUsuariosPage() {
  const admin = createSupabaseAdminClient()

  const {
    data: { users },
  } = await admin.auth.admin.listUsers()

  // Profiles for role info
  const { data: profiles } = await admin.from("profiles").select("id, role")

  // Wishlist counts per user
  const { data: wishlistCounts } = await admin.from("wishlist").select("user_id")
  const wishlistByUser: Record<string, number> = {}
  wishlistCounts?.forEach((w) => {
    wishlistByUser[w.user_id] = (wishlistByUser[w.user_id] ?? 0) + 1
  })

  // Order counts per user
  const { data: orderCounts } = await admin.from("orders").select("user_id")
  const ordersByUser: Record<string, number> = {}
  orderCounts?.forEach((o) => {
    ordersByUser[o.user_id] = (ordersByUser[o.user_id] ?? 0) + 1
  })

  const profileMap: Record<string, string> = {}
  profiles?.forEach((p) => {
    profileMap[p.id] = p.role ?? "user"
  })

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-text-main">Usuarios</h1>
        <p className="text-text-soft text-sm">{users.length} registrados</p>
      </div>

      <div className="rounded-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Registrado</th>
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
                  <td className="px-6 py-4 text-sm text-text-soft">{wishlistByUser[u.id] ?? 0}</td>
                  <td className="px-6 py-4 text-sm text-text-soft">{ordersByUser[u.id] ?? 0}</td>
                  <td className="px-6 py-4">
                    <RoleSelect userId={u.id} currentRole={profileMap[u.id] ?? "user"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
