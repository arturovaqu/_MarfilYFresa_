"use client"

import { useRouter } from "next/navigation"
import { X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useShop } from "@/context/shop-context"
import { createSupabaseBrowserClient } from "@/lib/supabase"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cartItems, cartTotal, removeFromCart, updateQuantity } = useShop()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleCheckout() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      onClose()
      router.push("/auth?redirect=carrito")
      return
    }
    onClose()
    router.push("/carrito")
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-cream shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brown/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-terracota" />
            <h2 className="font-serif text-lg text-text-main">Tu carrito</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-text-soft hover:bg-terracota/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <ShoppingBag className="h-16 w-16 text-terracota/30" />
              <p className="font-serif text-lg text-text-main">Tu carrito está vacío</p>
              <p className="text-sm text-text-soft">¡Añade algo bonito! 🍓</p>
              <button
                onClick={onClose}
                className="mt-2 rounded-full bg-terracota px-6 py-2 text-sm font-medium text-white hover:bg-brown transition-colors"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cartItems.map((item) => (
                <li key={item.id} className="flex gap-4 rounded-2xl bg-white p-3">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <p className="font-serif text-sm text-text-main leading-tight">{item.name}</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-text-soft hover:text-terracota transition-colors ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full bg-cream px-1 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-terracota/10 transition-colors"
                        >
                          <Minus className="h-3 w-3 text-text-main" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium text-text-main">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-terracota/10 transition-colors"
                        >
                          <Plus className="h-3 w-3 text-text-main" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-terracota">
                        {(item.price * item.quantity).toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-brown/10 px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text-main">Total</span>
              <span className="font-serif text-xl text-terracota">{cartTotal.toFixed(2)} €</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full rounded-full bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors"
            >
              Tramitar pedido
            </button>
            <p className="text-center text-xs text-text-soft">
              Necesitas una cuenta para hacer el pedido
            </p>
          </div>
        )}
      </div>
    </>
  )
}
