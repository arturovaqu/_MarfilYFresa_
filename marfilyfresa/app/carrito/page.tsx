"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { useShop } from "@/context/shop-context"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function CarritoPage() {
  const { cartItems, cartTotal, clearCart } = useShop()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth?redirect=carrito")
        return
      }

      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          status: "pending",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
      }))

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Send notification email to admin via API
      await fetch("/api/notify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          customerName: name,
          customerEmail: user.email,
          customerPhone: phone,
          customerAddress: address,
          notes,
          items: cartItems,
          total: cartTotal,
        }),
      })

      clearCart()
      setSuccess(true)
    } catch (err) {
      setError("Hubo un problema al enviar el pedido. Inténtalo de nuevo.")
      console.error(err)
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
          <h1 className="font-serif text-3xl text-text-main mb-3">¡Pedido enviado! 🍓</h1>
          <p className="text-text-soft max-w-md mb-8">
            Hemos recibido tu pedido. Te escribiremos pronto para confirmar los detalles y el envío.
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
            <div className="border-t border-brown/10 pt-4 flex items-center justify-between">
              <span className="font-medium text-text-main">Total</span>
              <span className="font-serif text-xl text-terracota">{cartTotal.toFixed(2)} €</span>
            </div>
          </div>

          {/* Customer form */}
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 space-y-4">
            <h2 className="font-serif text-lg text-text-main mb-2">Tus datos</h2>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Nombre completo *</label>
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
              <label className="block text-sm font-medium text-text-main mb-1">Teléfono / WhatsApp *</label>
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
              <label className="block text-sm font-medium text-text-main mb-1">Dirección de envío *</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                placeholder="Calle, número, piso, ciudad, código postal..."
                className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-main mb-1">
                Notas adicionales <span className="text-text-soft font-normal">(opcional)</span>
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
              Confirmar pedido · {cartTotal.toFixed(2)} €
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
