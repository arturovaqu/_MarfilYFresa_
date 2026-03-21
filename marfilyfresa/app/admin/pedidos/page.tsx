import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { OrderStatusSelect } from "@/components/admin/order-status-select"

export default async function AdminPedidosPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/")

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, total_amount, status, created_at, user_id,
      order_items (
        id, quantity, price_at_time,
        products ( name, image_url )
      )
    `)
    .order("created_at", { ascending: false })

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-brown text-cream px-6 py-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-cream/70 hover:text-cream transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
        <span className="font-serif text-lg">Pedidos</span>
        <div />
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-text-soft text-sm mb-6">{orders?.length ?? 0} pedidos</p>

        {!orders || orders.length === 0 ? (
          <div className="rounded-2xl bg-white flex items-center justify-center py-16 text-text-soft text-sm">
            No hay pedidos todavía
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-mono text-xs text-text-soft">#{order.id.slice(0, 8)}</p>
                    <p className="font-serif text-xl text-terracota mt-1">
                      {Number(order.total_amount).toFixed(2)} €
                    </p>
                    <p className="text-xs text-text-soft mt-1">
                      {new Date(order.created_at).toLocaleDateString("es-ES", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <OrderStatusSelect orderId={order.id} currentStatus={order.status ?? "pending"} />
                </div>

                {/* Order items */}
                <div className="border-t border-brown/10 pt-4">
                  <p className="text-xs font-medium text-text-soft uppercase mb-3">Productos</p>
                  <div className="space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.products?.image_url && (
                          <img
                            src={item.products.image_url}
                            alt={item.products?.name ?? ""}
                            className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
                          />
                        )}
                        <span className="text-sm text-text-main flex-1">
                          {item.products?.name ?? "Producto eliminado"}
                        </span>
                        <span className="text-xs text-text-soft">x{item.quantity}</span>
                        <span className="text-sm font-medium text-terracota">
                          {(item.price_at_time * item.quantity).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
