"use client"

import { useState, useRef } from "react"
import { X } from "lucide-react"

interface Props {
  productId: string
  productName: string
  onClose: () => void
}

export function StockRequestModal({ productId, productName, onClose }: Props) {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const overlayRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/stock-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          product_name: productName,
          customer_email: email.trim(),
        }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      setSent(true)
    } catch {
      setError("Algo salió mal, inténtalo de nuevo.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-cream p-2 transition-colors hover:bg-brown/10"
        >
          <X className="h-4 w-4 text-text-main" />
        </button>

        {sent ? (
          <div className="py-4 text-center">
            <p className="mb-3 text-4xl">🍓</p>
            <p className="mb-2 font-serif text-xl text-text-main">¡Listo!</p>
            <p className="text-sm text-text-soft">
              Te avisaremos cuando{" "}
              <strong className="text-text-main">{productName}</strong> vuelva a
              estar disponible.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-full bg-terracota px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brown"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h3 className="mb-1 font-serif text-xl text-text-main">
              Solicitar aviso
            </h3>
            <p className="mb-5 text-sm text-text-soft">
              Te escribiremos cuando{" "}
              <strong className="text-text-main">{productName}</strong> vuelva a
              estar disponible.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
                className="mb-3 w-full rounded-2xl border border-brown/20 px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
              />
              {error && (
                <p className="mb-3 text-xs text-red-500">{error}</p>
              )}
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-terracota py-3 text-sm font-medium text-white transition-colors hover:bg-brown disabled:opacity-50"
              >
                {sending ? "Guardando..." : "Avisadme cuando llegue"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
