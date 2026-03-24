"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function RoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value
    setRole(newRole)
    setLoading(true)
    try {
      await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={role}
      onChange={handleChange}
      disabled={loading}
      className={`rounded-full border px-3 py-1 text-xs font-medium focus:outline-none cursor-pointer disabled:opacity-50 ${
        role === "admin"
          ? "bg-terracota/10 text-terracota border-terracota/20"
          : "bg-brown/10 text-brown border-brown/20"
      }`}
    >
      <option value="user">Usuario</option>
      <option value="admin">Admin</option>
    </select>
  )
}
