import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { Heart } from "lucide-react"

interface WishlistRow {
  id: string
  user_id: string
  product_id: string | null
  product_name: string
  created_at: string
  products: { name: string; image_url: string | null; price: number; category: string | null } | null
}

export default async function AdminFavoritosPage() {
  const admin = createSupabaseAdminClient()

  const { data: wishlist } = (await admin
    .from("wishlist")
    .select("id, user_id, product_id, product_name, created_at, products ( name, image_url, price, category )")
    .order("created_at", { ascending: false })) as unknown as { data: WishlistRow[] | null }

  // Emails de usuarios
  const {
    data: { users },
  } = await admin.auth.admin.listUsers()
  const emailById: Record<string, string> = {}
  users.forEach((u) => {
    emailById[u.id] = u.email ?? u.id.slice(0, 8)
  })

  // Productos más deseados (ranking)
  const countByProduct: Record<string, { name: string; image_url: string | null; count: number; price: number }> = {}
  wishlist?.forEach((w) => {
    const key = w.product_id ?? w.product_name
    if (!countByProduct[key]) {
      countByProduct[key] = {
        name: w.products?.name ?? w.product_name,
        image_url: w.products?.image_url ?? null,
        count: 0,
        price: w.products?.price ?? 0,
      }
    }
    countByProduct[key].count++
  })
  const ranking = Object.values(countByProduct).sort((a, b) => b.count - a.count).slice(0, 5)

  const total = wishlist?.length ?? 0
  const uniqueUsers = new Set(wishlist?.map((w) => w.user_id)).size
  const uniqueProducts = Object.keys(countByProduct).length

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-text-main">Favoritos</h1>
        <p className="text-text-soft text-sm">{total} guardados en total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total favoritos", value: total },
          { label: "Usuarias activas", value: uniqueUsers },
          { label: "Productos deseados", value: uniqueProducts },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5">
            <p className="font-serif text-3xl text-text-main">{s.value}</p>
            <p className="text-sm text-text-soft mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Ranking de productos más deseados */}
      {ranking.length > 0 && (
        <div className="rounded-2xl bg-white p-6 mb-6">
          <h2 className="font-serif text-lg text-text-main mb-4">Productos más deseados</h2>
          <div className="space-y-3">
            {ranking.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4">
                <span className="w-6 text-sm font-medium text-text-soft">{i + 1}.</span>
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                )}
                <span className="flex-1 text-sm font-medium text-text-main">{p.name}</span>
                <span className="text-sm text-text-soft">{Number(p.price).toFixed(2)} €</span>
                <div className="flex items-center gap-1.5 rounded-full bg-terracota/10 px-3 py-1">
                  <Heart className="h-3 w-3 text-terracota" />
                  <span className="text-xs font-medium text-terracota">{p.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla completa */}
      {!wishlist || wishlist.length === 0 ? (
        <div className="rounded-2xl bg-white flex items-center justify-center py-16 text-text-soft text-sm">
          Nadie ha guardado favoritos todavía
        </div>
      ) : (
        <div className="rounded-2xl bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-brown/10">
            <h2 className="font-serif text-lg text-text-main">Todos los favoritos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Usuaria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/5">
                {wishlist.map((w) => (
                  <tr key={w.id} className="hover:bg-cream/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {w.products?.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.products.image_url}
                            alt={w.products?.name ?? w.product_name}
                            className="h-9 w-9 rounded-xl object-cover flex-shrink-0"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-text-main">
                            {w.products?.name ?? w.product_name}
                          </p>
                          {w.products?.category && (
                            <p className="text-xs text-text-soft capitalize">{w.products.category}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-soft">
                      {emailById[w.user_id] ?? w.user_id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-soft whitespace-nowrap">
                      {new Date(w.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
