"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2, CheckCircle, Tag, X } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

interface DiscountResult {
  discountType: "percentage" | "fixed"
  discountValue: number
  originalTotal: number
  discountAmount: number
  finalTotal: number
}

const PICKUP_POINTS = [
  { id: "opcion-1", label: "Opción 1" },
  { id: "opcion-2", label: "Opción 2" },
  { id: "opcion-3", label: "Opción 3" },
]

export default function CarritoPage() {
  const { cartItems, cartTotal, clearCart } = useShop()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [pickupPoint, setPickupPoint] = useState("")
  const [notes, setNotes] = useState("")

  // Discount code state
  const [discountInput, setDiscountInput] = useState("")
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountError, setDiscountError] = useState("")
  const [discount, setDiscount] = useState<DiscountResult | null>(null)
  const [appliedCode, setAppliedCode] = useState("")

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [error, setError] = useState("")

  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  const finalTotal = discount?.finalTotal ?? cartTotal

  async function handleApplyDiscount() {
    if (!discountInput.trim()) return
    setDiscountError("")
    setDiscountLoading(true)
    try {
      const res = await fetch("/api/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountInput.trim(),
          items: cartItems.map((i) => ({ id: i.id, price: i.price, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDiscountError(data.error ?? "Código no válido")
        return
      }
      setDiscount(data)
      setAppliedCode(discountInput.trim().toUpperCase())
    } catch {
      setDiscountError("Error al validar el código. Inténtalo de nuevo.")
    } finally {
      setDiscountLoading(false)
    }
  }

  function removeDiscount() {
    setDiscount(null)
    setAppliedCode("")
    setDiscountInput("")
    setDiscountError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!pickupPoint) {
      setError("Debes seleccionar un punto de recogida.")
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth?redirect=carrito")
        return
      }

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerAddress: pickupPoint,
          notes,
          items: cartItems,
          total: cartTotal,
          discountCode: appliedCode || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Hubo un problema al enviar el pedido. Inténtalo de nuevo.")
        return
      }

      clearCart()
      setOrderNumber(data.orderNumber)
      setSuccess(true)
    } catch {
      setError("Hubo un problema al enviar el pedido. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <CheckCircle className="h-20 w-20 text-terracota mb-6" />
          <h1 className="font-serif text-3xl text-text-main mb-2">¡Pedido enviado! 🍓</h1>
          {orderNumber && (
            <p className="text-sm font-mono text-text-soft mb-3">{orderNumber}</p>
          )}
          <p className="text-text-soft max-w-md mb-8">
            Hemos recibido tu pedido y te enviamos un email de confirmación. Nos pondremos en
            contacto contigo pronto para confirmar los detalles y el envío.
          </p>
          <Link
            href="/"
            className="rounded-full bg-terracota px-8 py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <p className="font-serif text-2xl text-text-main mb-3">Tu carrito está vacío</p>
          <Link href="/catalogo" className="text-terracota hover:text-brown transition-colors text-sm">
            Ver catálogo →
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-text-soft hover:text-text-main transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>

        <h1 className="font-serif text-3xl text-text-main mb-8">Tu pedido</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order summary */}
          <div className="rounded-3xl bg-white p-6 h-fit">
            <h2 className="font-serif text-lg text-text-main mb-4">Resumen</h2>
            <ul className="space-y-3 mb-6">
              {cartItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">{item.name}</p>
                    <p className="text-xs text-text-soft">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-terracota flex-shrink-0">
                    {(item.price * item.quantity).toFixed(2)} €
                  </p>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t border-brown/10 pt-4 space-y-2">
              {discount && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-soft">Subtotal</span>
                    <span className="text-text-soft">{cartTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-green-700">
                      <Tag className="h-3.5 w-3.5" />
                      {appliedCode}
                    </span>
                    <span className="text-green-700 font-medium">−{discount.discountAmount.toFixed(2)} €</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="font-medium text-text-main">Total</span>
                <span className="font-serif text-xl text-terracota">{finalTotal.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Customer form */}
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 space-y-4">
            <h2 className="font-serif text-lg text-text-main mb-2">Tus datos</h2>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Tu nombre"
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="612 345 678"
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-2">
                Punto de recogida *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {PICKUP_POINTS.map((point) => (
                  <button
                    key={point.id}
                    type="button"
                    onClick={() => setPickupPoint(point.label)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all ${
                      pickupPoint === point.label
                        ? "border-terracota bg-terracota/10 text-terracota"
                        : "border-brown/20 bg-cream text-text-main hover:border-terracota/50 hover:bg-terracota/5"
                    }`}
                  >
                    {point.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount code */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Código de descuento{" "}
                <span className="font-normal text-text-soft">(opcional)</span>
              </label>

              {discount ? (
                <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-700" />
                    <span className="text-sm font-medium text-green-700">{appliedCode}</span>
                    <span className="text-sm text-green-600">
                      − {discount.discountAmount.toFixed(2)} €
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    className="rounded-full p-1 text-green-600 hover:bg-green-100 transition-colors"
                    title="Quitar código"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountInput}
                    onChange={(e) => {
                      setDiscountInput(e.target.value.toUpperCase())
                      setDiscountError("")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyDiscount())}
                    placeholder="CODIGO10"
                    className="flex-1 rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={discountLoading || !discountInput.trim()}
                    className="rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm font-medium text-text-main hover:border-terracota hover:text-terracota transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {discountLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                  </button>
                </div>
              )}

              {discountError && (
                <p className="mt-1.5 text-xs text-red-600">{discountError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Notas adicionales{" "}
                <span className="text-text-soft font-normal">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="¿Alguna petición especial? 🍓"
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota resize-none"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar pedido · {finalTotal.toFixed(2)} €
            </button>

            <p className="text-center text-xs text-text-soft">
              Nos pondremos en contacto contigo para confirmar el pago y el envío
            </p>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
