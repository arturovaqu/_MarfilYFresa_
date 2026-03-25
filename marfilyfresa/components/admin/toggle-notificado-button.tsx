"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  requestId: string
  notified: boolean
}

export function ToggleNotificadoButton({ requestId, notified }: Props) {
  const [current, setCurrent] = useState(notified)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    await fetch(`/api/stock-request/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notified: !current }),
    })
    setCurrent(!current)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-all disabled:opacity-50 ${
        current
          ? "bg-brown/10 text-brown hover:bg-brown/20"
          : "bg-terracota/10 text-terracota hover:bg-terracota/20"
      }`}
    >
      {loading ? "..." : current ? "Notificado" : "Pendiente"}
    </button>
  )
}
