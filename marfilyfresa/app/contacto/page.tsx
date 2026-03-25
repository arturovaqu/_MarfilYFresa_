"use client"

import { useState } from "react"
import { MessageCircle, Send, Loader2, CheckCircle } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function ContactoPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al enviar el mensaje")
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl text-text-main mb-4">
            Contacto
          </h1>
          <p className="text-text-soft text-lg max-w-xl mx-auto">
            ¿Tienes alguna pregunta? Escríbenos y te respondemos lo antes posible.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 items-start">

          {/* Contact info */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-8">
              <h2 className="font-serif text-2xl text-text-main mb-6">Habla con nosotras</h2>

              <div className="space-y-4">
                <a
                  href="https://wa.me/34644065770"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-2xl bg-[#25D366]/10 p-4 transition-colors hover:bg-[#25D366]/20"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-text-main">WhatsApp</p>
                    <p className="text-sm text-text-soft">+34 612 345 678</p>
                    <p className="text-xs text-text-soft mt-0.5">Respuesta más rápida</p>
                  </div>
                </a>

                <div className="flex items-center gap-4 rounded-2xl bg-cream p-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-terracota/20 text-terracota">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-text-main">Formulario</p>
                    <p className="text-sm text-text-soft">Te respondemos en 24–48 horas</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-terracota/10 p-8">
              <p className="font-serif text-xl text-text-main mb-3">¿Dudas sobre un pedido?</p>
              <p className="text-text-soft text-sm leading-relaxed">
                Si tienes preguntas sobre un pedido existente, el envío o una devolución,
                escríbenos directamente por WhatsApp para una respuesta más rápida. 🍓
              </p>
            </div>
          </div>

          {/* Form */}
          {success ? (
            <div className="rounded-3xl bg-white p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
              <CheckCircle className="h-16 w-16 text-terracota mb-4" />
              <h3 className="font-serif text-2xl text-text-main mb-2">¡Mensaje enviado!</h3>
              <p className="text-text-soft">
                Gracias por escribirnos. Te responderemos lo antes posible. 🍓
              </p>
              <button
                onClick={() => {
                  setSuccess(false)
                  setName("")
                  setEmail("")
                  setSubject("")
                  setMessage("")
                }}
                className="mt-6 rounded-full border border-brown/20 px-6 py-2 text-sm font-medium text-text-main hover:bg-terracota/5 transition-colors"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-8 space-y-4">
              <h2 className="font-serif text-2xl text-text-main mb-2">Envíanos un mensaje</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">
                    Nombre *
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
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Asunto
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="¿En qué podemos ayudarte?"
                  className="w-full rounded-xl border border-brown/20 bg-cream px-4 py-3 text-sm text-text-main placeholder:text-text-soft focus:border-terracota focus:outline-none focus:ring-1 focus:ring-terracota"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-main mb-1">
                  Mensaje *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Cuéntanos qué necesitas..."
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
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar mensaje
              </button>

              <p className="text-center text-xs text-text-soft">
                También puedes escribirnos directamente por{" "}
                <a
                  href="https://wa.me/34644065770"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terracota hover:underline"
                >
                  WhatsApp
                </a>
              </p>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
