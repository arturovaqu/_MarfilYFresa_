import { createSupabaseServerClient } from "@/lib/supabase-server"
import Link from "next/link"
import { Plus, Pencil, Instagram, AlertCircle } from "lucide-react"
import { DeleteProductButton } from "@/components/admin/delete-product-button"
import { ToggleNotificadoButton } from "@/components/admin/toggle-notificado-button"

type Tab = "todos" | "agotados" | "solicitudes"

export default async function AdminProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab: tabParam } = await searchParams
  const tab: Tab =
    tabParam === "agotados" || tabParam === "solicitudes"
      ? tabParam
      : "todos"

  const supabase = await createSupabaseServerClient()

  // ── Todos ─────────────────────────────────────────────────────────────────
  const { data: allProducts } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  // ── Agotados ──────────────────────────────────────────────────────────────
  const agotados = (allProducts ?? []).filter(
    (p) => p.stock === null || p.stock <= 0
  )

  // Solicitudes count per agotado product
  const agotadoIds = agotados.map((p) => p.id)
  const { data: requestRows } =
    agotadoIds.length > 0
      ? await supabase
          .from("stock_requests")
          .select("product_id")
          .in("product_id", agotadoIds)
      : { data: [] }

  const countMap: Record<string, number> = {}
  for (const r of requestRows ?? []) {
    if (r.product_id) {
      countMap[r.product_id] = (countMap[r.product_id] ?? 0) + 1
    }
  }

  // ── Solicitudes ───────────────────────────────────────────────────────────
  const { data: solicitudes } = await supabase
    .from("stock_requests")
    .select("*")
    .order("created_at", { ascending: false })

  const products = allProducts ?? []

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "todos", label: "Todos", count: products.length },
    { key: "agotados", label: "Agotados", count: agotados.length },
    { key: "solicitudes", label: "Solicitudes de aviso", count: solicitudes?.length ?? 0 },
  ]

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-text-main">Productos</h1>
          <p className="text-text-soft text-sm mt-1">{products.length} productos</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/productos/instagram"
            className="flex items-center gap-2 rounded-full border border-brown/20 px-4 py-2 text-sm font-medium text-text-main hover:bg-terracota/5 transition-colors"
          >
            <Instagram className="h-4 w-4 text-terracota" />
            Instagram
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-2 rounded-full bg-terracota px-4 py-2 text-sm font-medium text-white hover:bg-brown transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-brown/10">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "todos" ? "/admin/productos" : `/admin/productos?tab=${t.key}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-terracota text-terracota"
                : "border-transparent text-text-soft hover:text-text-main"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  tab === t.key
                    ? "bg-terracota/10 text-terracota"
                    : "bg-brown/10 text-text-soft"
                }`}
              >
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ── Tab: Todos ─────────────────────────────────────────────────── */}
      {tab === "todos" && (
        <div className="rounded-2xl bg-white overflow-hidden">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-text-soft mb-4">No hay productos todavía</p>
              <Link
                href="/admin/productos/nuevo"
                className="rounded-full bg-terracota px-6 py-2 text-sm text-white hover:bg-brown transition-colors"
              >
                Crear el primero
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-soft uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/5">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-cream/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
                            />
                          )}
                          <span className="font-medium text-text-main text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-soft capitalize">
                        {product.category ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-terracota">
                        {Number(product.price).toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 text-sm text-text-soft">
                        {product.stock ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {(product.stock === null || product.stock <= 0) && (
                            <span className="rounded-full bg-brown/10 px-2 py-0.5 text-xs text-brown">
                              Agotado
                            </span>
                          )}
                          {product.is_featured && (
                            <span className="rounded-full bg-terracota/10 px-2 py-0.5 text-xs text-terracota">
                              Novedad
                            </span>
                          )}
                          {product.is_on_sale && (
                            <span className="rounded-full bg-brown/10 px-2 py-0.5 text-xs text-brown">
                              Oferta
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/productos/${product.id}`}
                            className="rounded-full p-2 text-text-soft hover:bg-terracota/10 hover:text-terracota transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <DeleteProductButton productId={product.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Agotados ──────────────────────────────────────────────── */}
      {tab === "agotados" && (
        <div className="rounded-2xl bg-white overflow-hidden">
          {agotados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-text-soft">No hay productos agotados 🍓</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Avisos
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-soft uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/5">
                  {agotados.map((product) => {
                    const avisos = countMap[product.id] ?? 0
                    return (
                      <tr key={product.id} className="hover:bg-cream/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-10 w-10 rounded-xl object-cover flex-shrink-0 grayscale"
                              />
                            )}
                            <span className="font-medium text-text-main text-sm">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-soft capitalize">
                          {product.category ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-terracota">
                          {Number(product.price).toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 text-sm text-text-soft">
                          <span className="rounded-full bg-brown/10 px-2 py-0.5 text-xs text-brown">
                            {product.stock ?? "null"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {avisos > 0 ? (
                            <span className="rounded-full bg-terracota/10 px-3 py-1 text-xs font-medium text-terracota">
                              {avisos} {avisos === 1 ? "solicitud" : "solicitudes"}
                            </span>
                          ) : (
                            <span className="text-xs text-text-soft">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/productos/${product.id}`}
                              className="rounded-full p-2 text-text-soft hover:bg-terracota/10 hover:text-terracota transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <DeleteProductButton productId={product.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Solicitudes ───────────────────────────────────────────── */}
      {tab === "solicitudes" && (
        <div className="rounded-2xl bg-white overflow-hidden">
          {!solicitudes || solicitudes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-text-soft">No hay solicitudes todavía</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cream/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown/5">
                  {solicitudes.map((s) => (
                    <tr key={s.id} className="hover:bg-cream/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-text-main">
                        {s.product_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-soft">
                        {s.customer_email}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-soft">
                        {new Date(s.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <ToggleNotificadoButton
                          requestId={s.id}
                          notified={s.notified ?? false}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
