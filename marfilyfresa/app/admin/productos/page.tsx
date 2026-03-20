import { createSupabaseServerClient } import { createSupabaseServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Trash2, ArrowLeft, Instagram } from "lucide-react"
import { DeleteProductButton } from "@/components/admin/delete-product-button"

export default async function AdminProductosPage() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth?redirect=admin")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/")

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-brown text-cream px-6 py-4 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-cream/70 hover:text-cream transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
        <span className="font-serif text-lg">Productos</span>
        <div className="flex gap-2">
          <Link
            href="/admin/productos/instagram"
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-cream hover:bg-white/20 transition-colors"
          >
            <Instagram className="h-4 w-4" />
            Instagram
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-2 rounded-full bg-terracota px-4 py-1.5 text-sm text-white hover:bg-terracota/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-soft text-sm">{products?.length ?? 0} productos</p>
        </div>

        <div className="rounded-2xl bg-white overflow-hidden">
          {!products || products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-text-soft mb-4">No hay productos todavía</p>
              <Link href="/admin/productos/nuevo" className="rounded-full bg-terracota px-6 py-2 text-sm text-white hover:bg-brown transition-colors">
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
                        <div className="flex gap-1">
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
      </main>
    </div>
  )
}
