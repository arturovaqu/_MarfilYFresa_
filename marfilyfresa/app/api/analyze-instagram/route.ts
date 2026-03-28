// app/api/analyze-instagram/route.ts
// Analiza un post de Instagram y extrae los datos del producto con Gemini

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '')

const PROMPT_JSON = `Extrae la información y devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta, sin explicaciones ni texto adicional:
{
  "name": "nombre corto y descriptivo del producto",
  "description": "descripción atractiva de 1-2 frases",
  "price": 12.99,
  "category": "anillos" | "collares" | "pulseras" | "pendientes" | "bolsos" | "sudaderas" | "otros"
}

Si no encuentras el precio, pon null. El nombre debe ser conciso (máximo 5 palabras).`

export async function POST(request: NextRequest) {
  try {
    const { url, manualDescription } = await request.json()

    if (!url && !manualDescription) {
      return NextResponse.json(
        { error: 'Necesitas proporcionar una URL o una descripción' },
        { status: 400 }
      )
    }

    let imageUrl: string | null = null
    let description: string = manualDescription ?? ''

    // ── Si hay URL, intentamos extraer los datos del post ─────────────────────
    if (url) {
      const browserUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      const baseHeaders = {
        'User-Agent': browserUA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Sec-Fetch-Mode': 'navigate',
      }

      const shortcodeMatch = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/)
      const shortcode = shortcodeMatch?.[1]

      // Estrategia 0: oEmbed API (pública, sin auth, devuelve thumbnail_url)
      if (shortcode && !imageUrl) {
        try {
          const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(`https://www.instagram.com/p/${shortcode}/`)}&omitscript=true`
          const res = await fetch(oembedUrl, { headers: { 'User-Agent': browserUA } })
          if (res.ok) {
            const data = await res.json() as { thumbnail_url?: string; title?: string }
            if (data.thumbnail_url) imageUrl = data.thumbnail_url
            if (!manualDescription && data.title) description = data.title
          }
        } catch {
          console.warn('Estrategia oEmbed falló')
        }
      }

      // Estrategia 1: endpoint /embed/
      if (shortcode && !imageUrl) {
        try {
          const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`
          const res = await fetch(embedUrl, { headers: baseHeaders })
          const html = await res.text()

          const patterns = [
            /<meta property="og:image" content="([^"]+)"/,
            /<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]+src="([^"]+)"/,
            /"display_url":"(https:[^"]+)"/,
            /src="(https:\/\/[^"]*cdninstagram[^"]+)"/,
            /src="(https:\/\/[^"]*fbcdn[^"]+)"/,
          ]
          for (const p of patterns) {
            const m = html.match(p)
            if (m) { imageUrl = m[1].replace(/\\u0026/g, '&'); break }
          }

          if (!manualDescription) {
            const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/)
            if (descMatch) description = decodeHTMLEntities(descMatch[1])
          }
        } catch {
          console.warn('Estrategia embed falló')
        }
      }

      // Estrategia 2: URL original
      if (!imageUrl) {
        try {
          const res = await fetch(url, { headers: baseHeaders })
          const html = await res.text()

          const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
          if (imageMatch) imageUrl = imageMatch[1]

          if (!manualDescription && !description) {
            const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/)
            if (descMatch) description = decodeHTMLEntities(descMatch[1])
          }
        } catch {
          console.warn('Estrategia URL principal falló')
        }
      }
    }

    if (!description && !imageUrl) {
      return NextResponse.json(
        {
          error:
            'Instagram no permitió acceder al post (requiere estar logueado o el post es privado). Pega la descripción del post manualmente en el campo de abajo.',
          fallback: true,
        },
        { status: 422 }
      )
    }

    // ── Llamar a Gemini ───────────────────────────────────────────────────────
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    let rawText: string

    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl)
        const imgBuffer = await imgRes.arrayBuffer()
        const base64 = Buffer.from(imgBuffer).toString('base64')
        const mimeType = (imgRes.headers.get('content-type') ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

        const result = await model.generateContent([
          {
            inlineData: { data: base64, mimeType },
          },
          `Analiza este producto de joyería/moda de la tienda MarfilYFresa.
${description ? `Descripción del post: "${description}"` : ''}

${PROMPT_JSON}`,
        ])
        rawText = result.response.text()
      } catch {
        // Si falla la imagen, solo texto
        const result = await model.generateContent(
          `Analiza este producto de la tienda de joyería MarfilYFresa basándote en esta descripción:\n"${description}"\n\n${PROMPT_JSON}`
        )
        rawText = result.response.text()
      }
    } else {
      const result = await model.generateContent(
        `Analiza este producto de la tienda de joyería MarfilYFresa basándote en esta descripción:\n"${description}"\n\n${PROMPT_JSON}`
      )
      rawText = result.response.text()
    }

    const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`Gemini no devolvió JSON válido: ${cleanJson.slice(0, 200)}`)
    const productData = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      data: {
        ...productData,
        image_url: imageUrl,
      },
    })

  } catch (error) {
    console.error('Error analizando Instagram:', error)
    return NextResponse.json(
      { error: `Error al analizar el post: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    )
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}
