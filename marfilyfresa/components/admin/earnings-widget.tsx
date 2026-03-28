"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState } from "react"
import { TrendingUp } from "lucide-react"

const PRESETS = [
  { label: "Todo", value: "all" },
  { label: "Este mes", value: "month" },
  { label: "Este año", value: "year" },
  { label: "Personalizado", value: "custom" },
]

export function EarningsWidget({ total, count }: { total: number; count: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activePreset = searchParams.get("period") ?? "all"
  const fromParam = searchParams.get("from") ?? ""
  const toParam = searchParams.get("to") ?? ""

  const [customFrom, setCustomFrom] = useState(fromParam)
  const [customTo, setCustomTo] = useState(toParam)

  function applyPreset(preset: string) {
    const params = new URLSearchParams()
    if (preset !== "all") params.set("period", preset)
    if (preset === "custom") {
      if (customFrom) params.set("from", customFrom)
      if (customTo) params.set("to", customTo)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function applyCustom() {
    const params = new URLSearchParams()
    params.set("period", "custom")
    if (customFrom) params.set("from", customFrom)
    if (customTo) params.set("to", customTo)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="rounded-2xl bg-white p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: figure */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-terracota" />
            <p className="text-sm font-medium text-text-soft">Ganancias</p>
          </div>
          <p className="font-serif text-4xl text-text-main">
            {total.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-2xl text-terracota ml-1">€</span>
          </p>
          <p className="text-xs text-text-soft mt-1">
            {count} pedido{count !== 1 ? "s" : ""} confirmado{count !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Right: filters */}
        <div className="flex flex-col items-end gap-2">
          {/* Preset pills */}
          <div className="flex gap-1.5 flex-wrap justify-end">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => applyPreset(p.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  activePreset === p.value
                    ? "bg-terracota text-white border-terracota"
                    : "bg-white text-text-soft border-brown/20 hover:border-terracota hover:text-terracota"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date range */}
          {activePreset === "custom" && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-lg border border-brown/20 px-2 py-1 text-xs text-text-main focus:outline-none focus:border-terracota bg-white"
              />
              <span className="text-xs text-text-soft">—</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-lg border border-brown/20 px-2 py-1 text-xs text-text-main focus:outline-none focus:border-terracota bg-white"
              />
              <button
                onClick={applyCustom}
                className="rounded-full bg-terracota text-white px-3 py-1 text-xs font-medium hover:bg-brown transition-colors"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
