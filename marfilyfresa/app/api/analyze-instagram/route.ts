// app/api/analyze-instagram/route.ts
// Analiza un post de Instagram y extrae los datos del producto con Claude

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

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

      // Extraer shortcode de la URL
      const shortcodeMatch = url.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/)
      const shortcode = shortcodeMatch?.[1]

      // Estrategia 1: endpoint /embed/ (más fiable que el post principal)
      if (shortcode && !imageUrl) {
        try {
          const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`
          const res = await fetch(embedUrl, { headers: baseHeaders })
          const html = await res.text()

          // Imagen desde múltiples patrones del embed
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

      // Estrategia 2: URL original con UA de navegador real
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

    // ── Preparar el mensaje para Claude ──────────────────────────────────────
    const messages: Anthropic.MessageParam[] = []

    if (imageUrl) {
      // Descargar la imagen y convertirla a base64
      try {
        const imgRes = await fetch(imageUrl)
        const imgBuffer = await imgRes.arrayBuffer()
        const base64 = Buffer.from(imgBuffer).toString('base64')
        const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'

        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: contentType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analiza este producto de joyería/moda de la tienda MarfilYFresa.
${description ? `Descripción del post: "${description}"` : ''}

Extrae la información y devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta, sin explicaciones ni texto adicional:
{
  "name": "nombre corto y descriptivo del producto",
  "description": "descripción atractiva de 1-2 frases",
  "price": 12.99,
  "category": "anillos" | "collares" | "pulseras" | "pendientes" | "bolsos" | "sudaderas" | "otros"
}

Si no encuentras el precio, pon null. El nombre debe ser conciso (máximo 5 palabras).`,
            },
          ],
        })
      } catch {
        // Si falla la descarga de la imagen, analizamos solo el texto
        messages.push({
          role: 'user',
          content: `Analiza este producto de la tienda de joyería MarfilYFresa basándote en esta descripción:
"${description}"

Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta, sin explicaciones ni texto adicional:
{
  "name": "nombre corto y descriptivo del producto",
  "description": "descripción atractiva de 1-2 frases",
  "price": 12.99,
  "category": "anillos" | "collares" | "pulseras" | "pendientes" | "bolsos" | "sudaderas" | "otros"
}

Si no encuentras el precio, pon null.`,
        })
      }
    } else {
      // Solo texto
      messages.push({
        role: 'user',
        content: `Analiza este producto de la tienda de joyería MarfilYFresa basándote en esta descripción:
"${description}"

Devuelve ÚNICAMENTE un objeto JSON con esta estructura exacta, sin explicaciones ni texto adicional:
{
  "name": "nombre corto y descriptivo del producto",
  "description": "descripción atractiva de 1-2 frases",
  "price": 12.99,
  "category": "anillos" | "collares" | "pulseras" | "pendientes" | "bolsos" | "sudaderas" | "otros"
}

Si no encuentras el precio, pon null.`,
      })
    }

    // ── Llamar a Claude ───────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages,
    })

    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')

    // Limpiar posibles backticks de markdown
    const cleanJson = rawText.replace(/```json\n?|\n?```/g, '').trim()
    const productData = JSON.parse(cleanJson)

    return NextResponse.json({
      success: true,
      data: {
        ...productData,
        image_url: imageUrl, // URL original de Instagram para previsualizar
      },
    })

  } catch (error) {
    console.error('Error analizando Instagram:', error)
    return NextResponse.json(
      { error: 'Error al analizar el post. Prueba con la descripción manual.' },
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
