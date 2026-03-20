"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Check, Instagram, AlertCircle } from "lucide-react"
import { createSupabaseBrowserClient } import { createSupabaseServerClient } from "@/lib/supabase-server"
import { useRouter } from "next/navigation"

const CATEGORIES = ["anillos", "collares", "pulseras", "pendientes", "bolsos", "sudaderas", "otros"]

export default function InstagramImportPage() {
  const [url, setUrl] = useState("")
  const [manualDescription, setManualDescription] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [fallback, setFallback] = useState(false)

  // Analyzed product data
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [analyzed, setAnalyzed] = useState(false)

  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  async function handleAnalyze() {
    if (!url && !manualDescription) {
      setError("Introduce una URL o una descripción")
      return
    }
    setError("")
    setAnalyzing(true)
    setFallback(false)

    try {
      const res = await fetch("/api/analyze-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url || undefined, manualDescription: manualDescription || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.fallback) {
          setFallback(true)
          setError("No se pudo analizar la URL. Prueba pegando la descripción del post abajo.")
        } else {
          throw new Error(data.error || "Error al analizar")
        }
        return
      }

      // Fill form with AI results
      setName(data.data.name ?? "")
      setDescription(data.data.description ?? "")
      setPrice(data.data.price?.toString() ?? "")
      setCategory(data.data.category ?? "")
      setImageUrl(data.data.image_url ?? "")
      setAnalyzed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar el post")
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave() {
    if (!name || !price) {
      setError("El nombre y el precio son obligatorios")
      return
    }
    setSaving(true)
    setError("")

    try {
      let finalImageUrl = imageUrl

      // If image_url is an Instagram URL, we save it directly
      // (in production you'd re-upload to Supabase Storage)

      await supabase.from("products").insert({
        name,
        description: description || null,
        price: parseFloat(price),
        category: category || null,
        image_url: finalImageUrl || null,
        is_featured: false,
        is_on_sale: false,
      })

      router.push("/admin/productos")
      router.refresh()
    } catch (err) {
      setError("Error al guardar el producto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-brown text-cream px-6 py-4 flex items-center justify-between">
        <Link href="/admin/productos" className="flex items-center gap-2 text-cream/70 hover:text-cream transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Productos
        </Link>
        <span className="font-serif text-lg">Importar de Instagram</span>
        <div />
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        {/* Step 1: URL or description */}
        <div className="rounded-2xl bg-white p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Instagram className="h-5 w-5 text-terracota" />
            <h2 className="font-medium text-text-main">Paso 1 — URL o descripción del post</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                URL del post de Instagram
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none"
              />
              <p className="text-xs text-text-soft mt-1">Solo funciona con posts públicos</p>
            </div>

            <div className="flex items-center gap-3 text-text-soft text-sm">
              <div className="flex-1 h-px bg-brown/10" />
              O
              <div className="flex-1 h-px bg-brown/10" />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Pega la descripción del post manualmente
              </label>
              <textarea
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                rows={4}
                placeholder="Pega aquí la descripción del post de Instagram..."
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none resize-none"
              />
            </div>
          </div>

          {fallback && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                No se pudo leer la URL automáticamente. Pega la descripción del post en el campo de texto y vuelve a analizar.
              </p>
            </div>
          )}

          {error && !fallback && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing || (!url && !manualDescription)}
            className="mt-4 w-full rounded-full bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {analyzing && <Loader2 className="h-4 w-4 animate-spin" />}
            Analizar con IA
          </button>
        </div>

        {/* Step 2: Review and save */}
        {analyzed && (
          <div className="rounded-2xl bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <Check className="h-5 w-5 text-green-500" />
              <h2 className="font-medium text-text-main">Paso 2 — Revisa y guarda</h2>
            </div>

            {/* Image preview */}
            {imageUrl && (
              <div className="mb-4">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-48 w-48 rounded-2xl object-cover"
                />
                <p className="text-xs text-text-soft mt-1">Imagen del post (previsualización)</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Nombre *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main focus:border-terracota focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main focus:border-terracota focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">Precio (€) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main focus:border-terracota focus:outline-none"
                  />
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
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 w-full rounded-full bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar producto
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
