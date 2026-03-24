"use client"

import { useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function ContactReadToggle({ contactId, read }: { contactId: string; read: boolean }) {
  const [checked, setChecked] = useState(read)
  const supabase = createSupabaseBrowserClient()
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.checked
    setChecked(newValue)
    await supabase.from("contacts").update({ read: newValue }).eq("id", contactId)
    router.refresh()
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={handleChange}
      className="h-4 w-4 cursor-pointer rounded accent-terracota"
    />
  )
}
