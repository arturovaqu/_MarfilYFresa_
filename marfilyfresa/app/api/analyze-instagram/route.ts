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
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          },
        })
        const html = await res.text()

        // Extraer imagen del og:image (funciona en posts públicos)
        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
        if (imageMatch) imageUrl = imageMatch[1]

        // Extraer descripción del og:description si no hay descripción manual
        if (!manualDescription) {
          const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/)
          if (descMatch) description = decodeHTMLEntities(descMatch[1])
        }
      } catch {
        // Si el scraping falla, continuamos con lo que tengamos
        console.warn('No se pudo hacer scraping del post, usando descripción manual')
      }
    }

    if (!description && !imageUrl) {
      return NextResponse.json(
        {
          error:
            'No se pudo extraer información del post. Prueba pegando la descripción manualmente.',
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
