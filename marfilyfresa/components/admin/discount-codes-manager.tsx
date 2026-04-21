"use client"

import { useState } from "react"
import { Trash2, Plus, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react"

interface Product {
  id: string
  name: string
}

interface DiscountCode {
  id: string
  code: string
  starts_at: string
  ends_at: string
  product_ids: string[]
  discount_type: "percentage" | "fixed"
  discount_value: number
  active: boolean
  created_at: string
}

interface Props {
  initialCodes: DiscountCode[]
  products: Product[]
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 10; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function getStatus(code: DiscountCode): "active" | "pending" | "expired" {
  const now = new Date()
  const start = new Date(code.starts_at)
  const end = new Date(code.ends_at)
  if (now < start) return "pending"
  if (now > end) return "expired"
  return "active"
}

const STATUS_CONFIG = {
  active: {
    label: "Activo",
    icon: CheckCircle,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  expired: {
    label: "Caducado",
    icon: XCircle,
    className: "bg-red-50 text-red-600 border-red-200",
  },
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DiscountCodesManager({ initialCodes, products }: Props) {
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Form state
  const [code, setCode] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState("")

  function resetForm() {
    setCode("")
    setStartsAt("")
    setEndsAt("")
    setSelectedProducts([])
    setDiscountType("percentage")
    setDiscountValue("")
    setFormError("")
  }

  function toggleProduct(id: string) {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")

    if (!code.trim()) {
      setFormError("El código es obligatorio.")
      return
    }
    if (!startsAt || !endsAt) {
      setFormError("Las fechas de inicio y fin son obligatorias.")
      return
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      setFormError("La fecha de fin debe ser posterior a la de inicio.")
      return
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      setFormError("El valor del descuento debe ser mayor que 0.")
      return
    }
    if (discountType === "percentage" && parseFloat(discountValue) > 100) {
      setFormError("El porcentaje no puede superar el 100%.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/discount-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          starts_at: new Date(startsAt).toISOString(),
          ends_at: new Date(endsAt).toISOString(),
          product_ids: selectedProducts,
          discount_type: discountType,
          discount_value: parseFloat(discountValue),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error ?? "Error al crear el código.")
        return
      }

      setCodes((prev) => [data.code, ...prev])
      resetForm()
      setShowForm(false)
    } catch {
      setFormError("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este código de descuento?")) return
    setCodes((prev) => prev.filter((c) => c.id !== id))
    await fetch(`/api/discount-codes/${id}`, { method: "DELETE" })
  }

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl text-text-main">Códigos de descuento</h1>
          <p className="text-text-soft text-sm mt-0.5">{codes.length} código{codes.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); resetForm() }}
          className="flex items-center gap-2 rounded-full bg-terracota px-5 py-2.5 text-sm font-medium text-white hover:bg-brown transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo código
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl bg-white border border-brown/10 p-6 mb-6 shadow-sm">
          <h2 className="font-serif text-lg text-text-main mb-5">Crear código</h2>
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Código *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 20))}
                  placeholder="Ej: VERANO25"
                  className="flex-1 rounded-xl border border-brown/20 bg-cream px-4 py-2.5 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota uppercase"
                />
                <button
                  type="button"
                  onClick={() => setCode(generateCode())}
                  className="flex items-center gap-1.5 rounded-xl border border-brown/20 bg-cream px-4 py-2.5 text-sm text-text-soft hover:border-terracota hover:text-terracota transition-colors whitespace-nowrap"
                  title="Generar código aleatorio (10 caracteres)"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Generar
                </button>
              </div>
              <p className="text-xs text-text-soft mt-1">El aleatorio genera 10 caracteres (letras y números).</p>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Fecha de inicio *
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-2.5 text-sm text-text-main focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Fecha de fin *
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-2.5 text-sm text-text-main focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
                />
              </div>
            </div>

            {/* Tipo de descuento */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Tipo de descuento *
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType("percentage")}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    discountType === "percentage"
                      ? "border-terracota bg-terracota/10 text-terracota"
                      : "border-brown/20 bg-cream text-text-main hover:border-terracota/40"
                  }`}
                >
                  % Porcentaje
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("fixed")}
                  className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    discountType === "fixed"
                      ? "border-terracota bg-terracota/10 text-terracota"
                      : "border-brown/20 bg-cream text-text-main hover:border-terracota/40"
                  }`}
                >
                  € Precio fijo
                </button>
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                {discountType === "percentage" ? "Porcentaje de descuento *" : "Precio fijo por producto *"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min="0.01"
                  max={discountType === "percentage" ? "100" : undefined}
                  step="0.01"
                  required
                  placeholder={discountType === "percentage" ? "10" : "9.99"}
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-2.5 pr-12 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-soft">
                  {discountType === "percentage" ? "%" : "€"}
                </span>
              </div>
            </div>

            {/* Productos */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Productos{" "}
                <span className="font-normal text-text-soft">(opcional — vacío = todos)</span>
              </label>
              <div className="rounded-xl border border-brown/20 bg-cream p-3 max-h-40 overflow-y-auto space-y-1">
                {products.length === 0 ? (
                  <p className="text-sm text-text-soft py-2 text-center">No hay productos</p>
                ) : (
                  products.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 rounded accent-terracota cursor-pointer"
                      />
                      <span className="text-sm text-text-main">{p.name}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedProducts.length > 0 && (
                <p className="text-xs text-terracota mt-1">
                  {selectedProducts.length} producto{selectedProducts.length !== 1 ? "s" : ""} seleccionado{selectedProducts.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {formError && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm() }}
                className="text-sm text-text-soft hover:text-text-main transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-terracota px-6 py-2.5 text-sm font-medium text-white hover:bg-brown transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Crear código"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {codes.length === 0 ? (
        <div className="rounded-2xl bg-white flex items-center justify-center py-16 text-text-soft text-sm">
          No hay códigos de descuento todavía
        </div>
      ) : (
        <div className="rounded-2xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-soft uppercase">Código</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-soft uppercase">Descuento</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-soft uppercase hidden md:table-cell">Vigencia</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-soft uppercase hidden lg:table-cell">Productos</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-text-soft uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/5">
                {codes.map((dc) => {
                  const status = getStatus(dc)
                  const cfg = STATUS_CONFIG[status]
                  const StatusIcon = cfg.icon
                  const productNames = dc.product_ids.length === 0
                    ? "Todos"
                    : dc.product_ids
                        .map((pid) => products.find((p) => p.id === pid)?.name ?? pid)
                        .join(", ")

                  return (
                    <tr key={dc.id} className="hover:bg-cream/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-text-main bg-cream rounded-lg px-2.5 py-1">
                          {dc.code}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-terracota">
                        {dc.discount_type === "percentage"
                          ? `${dc.discount_value}%`
                          : `${dc.discount_value.toFixed(2)} €`}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="text-xs text-text-soft space-y-0.5">
                          <p>Desde: {formatDateTime(dc.starts_at)}</p>
                          <p>Hasta: {formatDateTime(dc.ends_at)}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <p className="text-sm text-text-soft max-w-xs truncate" title={productNames}>
                          {productNames}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${cfg.className}`}>
                          <StatusIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleDelete(dc.id)}
                          className="rounded-full p-2 text-text-soft hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Eliminar código"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
