import { createSupabaseServerClient } import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, ShoppingBag, Users, Heart, Instagram, BarChart3 } from "lucide-react"

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth?redirect=admin")

  // Role check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/")

  // Stats
  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: totalUsers },
    { count: totalWishlist },
    { count: pendingOrders },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("wishlist").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id, total_amount, status, created_at").order("created_at", { ascending: false }).limit(5),
  ])

  const stats = [
    { label: "Productos", value: totalProducts ?? 0, icon: Package, href: "/admin/productos", color: "text-terracota" },
    { label: "Pedidos", value: totalOrders ?? 0, icon: ShoppingBag, href: "/admin/pedidos", color: "text-terracota", badge: pendingOrders ?? 0 },
    { label: "Usuarias", value: totalUsers ?? 0, icon: Users, href: "/admin/usuarios", color: "text-terracota" },
    { label: "Favoritos totales", value: totalWishlist ?? 0, icon: Heart, href: "#", color: "text-terracota" },
  ]

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Admin header */}
      <header className="bg-brown text-cream px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl">MarfilFresa</span>
          <span className="text-xs bg-terracota rounded-full px-3 py-1">Admin</span>
        </div>
        <Link href="/" className="text-sm text-cream/70 hover:text-cream transition-colors">
          ← Ver tienda
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl text-text-main mb-8">Panel de administración</h1>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-10">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="rounded-2xl bg-white p-5 hover:shadow-md transition-shadow relative"
            >
              <stat.icon className={`h-6 w-6 ${stat.color} mb-3`} />
              <p className="font-serif text-3xl text-text-main">{stat.value}</p>
              <p className="text-sm text-text-soft mt-1">{stat.label}</p>
              {stat.badge !== undefined && stat.badge > 0 && (
                <span className="absolute top-3 right-3 rounded-full bg-terracota px-2 py-0.5 text-xs font-medium text-white">
                  {stat.badge} nuevos
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-3 rounded-2xl bg-terracota p-5 text-white hover:bg-brown transition-colors"
          >
            <Package className="h-6 w-6" />
            <div>
              <p className="font-medium">Añadir producto</p>
              <p className="text-xs text-white/70">Crear producto nuevo</p>
            </div>
          </Link>
          <Link
            href="/admin/productos/instagram"
            className="flex items-center gap-3 rounded-2xl bg-white p-5 hover:shadow-md transition-shadow border border-brown/10"
          >
            <Instagram className="h-6 w-6 text-terracota" />
            <div>
              <p className="font-medium text-text-main">Importar de Instagram</p>
              <p className="text-xs text-text-soft">Analizar con IA</p>
            </div>
          </Link>
          <Link
            href="/admin/pedidos"
            className="flex items-center gap-3 rounded-2xl bg-white p-5 hover:shadow-md transition-shadow border border-brown/10"
          >
            <ShoppingBag className="h-6 w-6 text-terracota" />
            <div>
              <p className="font-medium text-text-main">Ver pedidos</p>
              <p className="text-xs text-text-soft">{pendingOrders ?? 0} pendientes</p>
            </div>
          </Link>
        </div>

        {/* Recent orders */}
        <div className="rounded-2xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-brown/10">
            <h2 className="font-serif text-lg text-text-main">Pedidos recientes</h2>
            <Link href="/admin/pedidos" className="text-sm text-terracota hover:text-brown transition-colors">
              Ver todos →
            </Link>
          </div>
          {!recentOrders || recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-text-soft text-sm">
              No hay pedidos todavía
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/5">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-text-soft font-mono">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-terracota">
                      {Number(order.total_amount).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status ?? "pending"] ?? "bg-gray-100 text-gray-700"}`}>
                        {statusLabels[order.status ?? "pending"] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-soft">
                      {new Date(order.created_at).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
