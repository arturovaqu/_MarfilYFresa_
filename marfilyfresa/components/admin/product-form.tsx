"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, Loader2, X } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase"

const CATEGORIES = ["anillos", "collares", "pulseras", "pendientes", "bolsos", "sudaderas", "otros"]

interface ProductFormProps {
  initialData?: {
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
    category: string | null
    stock: number | null
    is_featured: boolean | null
    is_on_sale: boolean | null
  }
}

export function ProductForm({ initialData }: ProductFormProps) {
  const isEdit = !!initialData

  const [name, setName] = useState(initialData?.name ?? "")
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "")
  const [category, setCategory] = useState(initialData?.category ?? "")
  const [stock, setStock] = useState(initialData?.stock?.toString() ?? "")
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false)
  const [isOnSale, setIsOnSale] = useState(initialData?.is_on_sale ?? false)
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState(initialData?.image_url ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split(".").pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("products")
      .upload(filename, file, { cacheControl: "3600", upsert: false })

    if (error) throw error

    const { data } = supabase.storage.from("products").getPublicUrl(filename)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let finalImageUrl = imageUrl

      // Upload image if new file selected
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile)
      }

      const productData = {
        name,
        description: description || null,
        price: parseFloat(price),
        category: category || null,
        stock: stock ? parseInt(stock) : null,
        is_featured: isFeatured,
        is_on_sale: isOnSale,
        image_url: finalImageUrl || null,
      }

      if (isEdit && initialData) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", initialData.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("products").insert(productData)
        if (error) throw error
      }

      router.push("/admin/productos")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el producto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-brown text-cream px-6 py-4 flex items-center justify-between">
        <Link href="/admin/productos" className="flex items-center gap-2 text-cream/70 hover:text-cream transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Productos
        </Link>
        <span className="font-serif text-lg">{isEdit ? "Editar producto" : "Nuevo producto"}</span>
        <div />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Image upload */}
          <div className="rounded-2xl bg-white p-6">
            <h2 className="font-medium text-text-main mb-4">Imagen del producto</h2>

            {imagePreview ? (
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden mb-4">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImagePreview(""); setImageFile(null); setImageUrl("") }}
                  className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-48 h-48 rounded-2xl border-2 border-dashed border-brown/20 bg-cream cursor-pointer hover:border-terracota transition-colors mb-4"
              >
                <Upload className="h-8 w-8 text-text-soft mb-2" />
                <p className="text-sm text-text-soft text-center">Subir imagen</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-terracota hover:text-brown transition-colors"
            >
              {imagePreview ? "Cambiar imagen" : "Elegir archivo"}
            </button>
          </div>

          {/* Basic info */}
          <div className="rounded-2xl bg-white p-6 space-y-4">
            <h2 className="font-medium text-text-main mb-2">Información</h2>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Nombre *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Anillo Margarita"
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Descripción del producto..."
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Precio (€) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  step="0.01"
                  min="0"
                  placeholder="12.99"
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Stock</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="0"
                  placeholder="10"
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main focus:border-terracota focus:outline-none"
              >
                <option value="">Sin categoría</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Flags */}
          <div className="rounded-2xl bg-white p-6 space-y-4">
            <h2 className="font-medium text-text-main mb-2">Etiquetas</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative h-6 w-11 rounded-full transition-colors ${isFeatured ? "bg-terracota" : "bg-brown/20"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isFeatured ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <span className="text-sm text-text-main">Marcar como novedad</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsOnSale(!isOnSale)}
                className={`relative h-6 w-11 rounded-full transition-colors ${isOnSale ? "bg-terracota" : "bg-brown/20"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isOnSale ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <span className="text-sm text-text-main">Marcar como oferta</span>
            </label>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/admin/productos"
              className="flex-1 rounded-full border border-brown/20 py-3 text-sm font-medium text-text-main text-center hover:bg-terracota/5 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
