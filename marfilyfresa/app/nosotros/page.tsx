import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Nosotros | MarfilYFresa",
  description: "Conoce la historia de MarfilYFresa, tu tienda de joyería colorida y divertida.",
}

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main>
        {/* Hero section */}
        <section className="py-20 bg-terracota/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">

              {/* Image */}
              <div className="relative w-full max-w-md lg:w-1/2">
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-terracota/20">
                  <Image
                    src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=750&fit=crop&q=80"
                    alt="Joyería artesanal colorida"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-terracota/30 blur-2xl" />
              </div>

              {/* Text */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="font-serif text-4xl sm:text-5xl text-text-main">
                  Hola, somos MarfilYFresa 🍓
                </h1>

                <div className="mt-6 space-y-4 text-text-soft leading-relaxed text-lg">
                  <p>
                    Somos una pequeña tienda online creada con mucho amor y dedicación.
                    Nuestra misión es traerte las piezas más bonitas, coloridas y únicas
                    que puedas encontrar.
                  </p>
                  <p>
                    Cada joya que seleccionamos está pensada para hacerte sonreír y
                    añadir ese toque especial a tu día a día. Nos encanta lo cute,
                    lo divertido y lo diferente.
                  </p>
                  <p>
                    Gracias por formar parte de esta comunidad tan especial.
                    ¡Esperamos que encuentres algo que te enamore!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values section */}
        <section className="py-20 bg-cream">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-serif text-3xl text-text-main text-center mb-12">
              Lo que nos define
            </h2>

            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-terracota/15 text-3xl">
                  🌸
                </div>
                <h3 className="font-serif text-xl text-text-main mb-2">Colorido</h3>
                <p className="text-text-soft text-sm leading-relaxed">
                  Piezas llenas de color que reflejan tu personalidad y alegran cualquier look.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-terracota/15 text-3xl">
                  ✨
                </div>
                <h3 className="font-serif text-xl text-text-main mb-2">Único</h3>
                <p className="text-text-soft text-sm leading-relaxed">
                  Seleccionamos cada pieza con cuidado para que siempre encuentres algo especial.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-terracota/15 text-3xl">
                  💛
                </div>
                <h3 className="font-serif text-xl text-text-main mb-2">Con amor</h3>
                <p className="text-text-soft text-sm leading-relaxed">
                  Cada pedido se prepara con mimo porque queremos que llegue perfecto a tus manos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
