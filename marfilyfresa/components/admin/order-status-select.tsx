"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } import { createSupabaseServerClient } from "@/lib/supabase-server"
import { useRouter } from "next/navigation"

const STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
]

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

export function OrderStatusSelect({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  async function handleChange(newStatus: string) {
    setStatus(newStatus)
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId)
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium focus:outline-none cursor-pointer ${statusColors[status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  )
}
