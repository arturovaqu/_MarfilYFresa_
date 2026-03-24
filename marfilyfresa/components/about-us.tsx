import Image from "next/image"

export function AboutUs() {
  return (
    <section id="nosotros" className="py-20 bg-terracota/10">
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
            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-terracota/30 blur-2xl" />
          </div>

          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <h2 className="font-serif text-3xl sm:text-4xl text-text-main">
              Hola, somos MarfilYFresa
            </h2>

            <div className="mt-6 space-y-4 text-text-soft leading-relaxed">
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
  )
}
