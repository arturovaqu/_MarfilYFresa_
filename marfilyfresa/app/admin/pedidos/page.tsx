import { createSupabaseServerClient } from "@/lib/supabase-server"
import { OrderStatusSelect } from "@/components/admin/order-status-select"

interface OrderItem {
  id: string
  quantity: number
  price_at_time: number
  products: { name: string; image_url: string | null } | null
}

interface OrderWithItems {
  id: string
  order_number: string | null
  total_amount: number
  status: string | null
  created_at: string
  user_id: string
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  notes: string | null
  order_items: OrderItem[]
}

export default async function AdminPedidosPage() {
  const supabase = await createSupabaseServerClient()

  const { data: orders } = (await supabase
    .from("orders")
    .select(
      `id, order_number, total_amount, status, created_at, user_id,
       customer_name, customer_phone, customer_address, notes,
       order_items ( id, quantity, price_at_time, products ( name, image_url ) )`
    )
    .order("created_at", { ascending: false })) as unknown as { data: OrderWithItems[] | null }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-text-main">Pedidos</h1>
        <p className="text-text-soft text-sm">{orders?.length ?? 0} pedidos</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl bg-white flex items-center justify-center py-16 text-text-soft text-sm">
          No hay pedidos todavía
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl bg-white p-6">
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-sm font-medium text-text-main">
                    {order.order_number ?? <span className="text-text-soft text-xs">{order.id.slice(0, 8)}</span>}
                  </p>
                  <p className="font-serif text-xl text-terracota mt-0.5">
                    {Number(order.total_amount).toFixed(2)} €
                  </p>
                  <p className="text-xs text-text-soft mt-1">
                    {new Date(order.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <OrderStatusSelect orderId={order.id} currentStatus={order.status ?? "pending"} />
              </div>

              {/* Customer info */}
              {(order.customer_name || order.customer_phone || order.customer_address) && (
                <div className="rounded-xl bg-cream px-4 py-3 mb-4 grid gap-1 text-sm">
                  {order.customer_name && (
                    <div className="flex gap-2">
                      <span className="text-text-soft w-20 flex-shrink-0">Nombre</span>
                      <span className="text-text-main font-medium">{order.customer_name}</span>
                    </div>
                  )}
                  {order.customer_phone && (
                    <div className="flex gap-2">
                      <span className="text-text-soft w-20 flex-shrink-0">Teléfono</span>
                      <span className="text-text-main">{order.customer_phone}</span>
                    </div>
                  )}
                  {order.customer_address && (
                    <div className="flex gap-2">
                      <span className="text-text-soft w-20 flex-shrink-0">Dirección</span>
                      <span className="text-text-main">{order.customer_address}</span>
                    </div>
                  )}
                  {order.notes && (
                    <div className="flex gap-2">
                      <span className="text-text-soft w-20 flex-shrink-0">Notas</span>
                      <span className="text-text-main italic">{order.notes}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Order items */}
              <div className="border-t border-brown/10 pt-4">
                <p className="text-xs font-medium text-text-soft uppercase mb-3">Productos</p>
                <div className="space-y-2">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.products?.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
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
    </div>
  )
}
