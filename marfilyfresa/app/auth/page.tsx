"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase"

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  )
}

function AuthContent() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/"
  const supabase = createSupabaseBrowserClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push(redirect.startsWith("/") ? redirect : "/")
        router.refresh()
      } else {
        // Register
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (error) throw error

        // Create profile
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            role: "user",
          })
        }

        setSuccess("¡Cuenta creada! Revisa tu email para confirmarla 🍓")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Algo salió mal"
      if (msg.includes("Invalid login credentials")) {
        setError("Email o contraseña incorrectos")
      } else if (msg.includes("User already registered")) {
        setError("Ya existe una cuenta con este email")
      } else if (msg.includes("Password should be at least")) {
        setError("La contraseña debe tener al menos 6 caracteres")
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-brown/10">
        <Link href="/" className="flex items-center gap-1">
          <span className="font-serif text-xl text-text-main">MarfilYFresa</span>
          <span className="text-sm">🍓</span>
        </Link>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            {/* Title */}
            <h1 className="font-serif text-2xl text-text-main text-center mb-2">
              {mode === "login" ? "Bienvenida de vuelta" : "Crear cuenta"}
            </h1>
            <p className="text-center text-sm text-text-soft mb-8">
              {mode === "login"
                ? "Inicia sesión para ver tus favoritos y hacer pedidos"
                : "Únete a MarfilYFresa 🍓"}
            </p>

            {/* Tabs */}
            <div className="flex rounded-full bg-cream p-1 mb-6">
              <button
                onClick={() => { setMode("login"); setError(""); setSuccess("") }}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${
                  mode === "login"
                    ? "bg-terracota text-white shadow-sm"
                    : "text-text-soft hover:text-text-main"
                }`}
              >
                Iniciar sesión
              </button>
              <button
                onClick={() => { setMode("register"); setError(""); setSuccess("") }}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${
                  mode === "register"
                    ? "bg-terracota text-white shadow-sm"
                    : "text-text-soft hover:text-text-main"
                }`}
              >
                Registrarse
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 pr-12 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-soft hover:text-text-main"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-terracota py-3 text-sm font-medium text-white hover:bg-brown transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login" ? "Entrar" : "Crear cuenta"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-text-soft mt-6">
            <Link href="/" className="text-terracota hover:text-brown transition-colors">
              ← Volver a la tienda
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
