// app/api/monthly-report/route.ts
// Informe mensual automático — se ejecuta el día 1 de cada mes a las 9:00
// Configurado en vercel.json como cron job

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupabaseAdminClient } from '@/lib/supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  // ── Seguridad: verificar que la llamada viene de Vercel Cron ──────────────
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const supabase = createSupabaseAdminClient()

    // ── Calcular rango del mes anterior ──────────────────────────────────────
    const now = new Date()
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const monthName = firstDayLastMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })

    // ── 1. Nuevos usuarios del mes ────────────────────────────────────────────
    const { data: newProfiles, count: newUsersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('id', firstDayLastMonth.toISOString()) // profiles.id = auth.users.id (UUID con timestamp)

    // Forma más fiable: consultar auth.users directamente
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const newUsers = authUsers?.users?.filter(u => {
      const created = new Date(u.created_at)
      return created >= firstDayLastMonth && created <= lastDayLastMonth
    }) ?? []

    // ── 2. Favoritos añadidos este mes ────────────────────────────────────────
    const { count: wishlistThisMonth } = await supabase
      .from('wishlist')
      .select('id', { count: 'exact' })
      .gte('created_at', firstDayLastMonth.toISOString())
      .lte('created_at', lastDayLastMonth.toISOString())

    // ── 3. Top 5 productos más wishlisted este mes ────────────────────────────
    const { data: wishlistThisMonthData } = await supabase
      .from('wishlist')
      .select('product_id, product_name')
      .gte('created_at', firstDayLastMonth.toISOString())
      .lte('created_at', lastDayLastMonth.toISOString())
      .not('product_id', 'is', null)

    const topThisMonth = countAndSort(wishlistThisMonthData ?? []).slice(0, 5)

    // ── 4. Top 5 productos más wishlisted en total ────────────────────────────
    const { data: allWishlistData } = await supabase
      .from('wishlist')
      .select('product_id, product_name')
      .not('product_id', 'is', null)

    const topAllTime = countAndSort(allWishlistData ?? []).slice(0, 5)

    // ── 5. Productos sin ningún favorito ──────────────────────────────────────
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, price, category')

    const { data: allWishlistProducts } = await supabase
      .from('wishlist')
      .select('product_id')
      .not('product_id', 'is', null)

    const wishlisted = new Set(allWishlistProducts?.map(w => w.product_id))
    const productsWithNoFavorites = (allProducts ?? []).filter(p => !wishlisted.has(p.id))

    // ── Generar y enviar email ────────────────────────────────────────────────
    const emailHtml = generateEmailHtml({
      monthName,
      newUsersCount: newUsers.length,
      wishlistThisMonth: wishlistThisMonth ?? 0,
      topThisMonth,
      topAllTime,
      productsWithNoFavorites,
      totalProducts: allProducts?.length ?? 0,
    })

    await resend.emails.send({
      from: 'MarfilFresa <informes@marfilfresa.com>',
      to: process.env.ADMIN_EMAIL!,
      subject: `📊 Informe mensual MarfilFresa — ${monthName}`,
      html: emailHtml,
    })

    return NextResponse.json({
      success: true,
      message: `Informe de ${monthName} enviado a ${process.env.ADMIN_EMAIL}`,
    })

  } catch (error) {
    console.error('Error generando informe mensual:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countAndSort(items: { product_id: string | null; product_name: string }[]) {
  const counts: Record<string, { name: string; count: number }> = {}
  for (const item of items) {
    if (!item.product_id) continue
    if (!counts[item.product_id]) {
      counts[item.product_id] = { name: item.product_name, count: 0 }
    }
    counts[item.product_id].count++
  }
  return Object.entries(counts)
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)
}

function generateEmailHtml({
  monthName,
  newUsersCount,
  wishlistThisMonth,
  topThisMonth,
  topAllTime,
  productsWithNoFavorites,
  totalProducts,
}: {
  monthName: string
  newUsersCount: number
  wishlistThisMonth: number
  topThisMonth: { id: string; name: string; count: number }[]
  topAllTime: { id: string; name: string; count: number }[]
  productsWithNoFavorites: { id: string; name: string; price: number; category: string | null }[]
  totalProducts: number
}) {
  const topList = (items: { name: string; count: number }[]) =>
    items.length === 0
      ? '<p style="color:#a07860;font-size:14px;">Sin datos este mes</p>'
      : items
          .map(
            (item, i) => `
            <tr>
              <td style="padding:8px 12px;color:#a07860;font-size:14px;">${i + 1}.</td>
              <td style="padding:8px 0;color:#764b36;font-size:14px;">${item.name}</td>
              <td style="padding:8px 12px;color:#d1774c;font-size:14px;text-align:right;">
                ♡ ${item.count}
              </td>
            </tr>`
          )
          .join('')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe mensual MarfilFresa</title>
</head>
<body style="margin:0;padding:0;background:#efe7dd;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#efe7dd;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#d1774c;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <h1 style="margin:0;font-size:28px;color:#ffffff;font-family:Georgia,serif;">
                MarfilFresa 🍓
              </h1>
              <p style="margin:8px 0 0;color:#efe7dd;font-size:16px;">
                Informe mensual — ${monthName}
              </p>
            </td>
          </tr>

          <!-- Resumen estadísticas -->
          <tr>
            <td style="background:#FFFFFF;padding:32px;">
              <h2 style="margin:0 0 20px;font-size:18px;color:#764b36;font-family:Georgia,serif;">
                Resumen del mes
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center;padding:16px;background:#efe7dd;border-radius:12px;">
                    <div style="font-size:32px;color:#d1774c;font-family:Georgia,serif;">${newUsersCount}</div>
                    <div style="font-size:13px;color:#a07860;margin-top:4px;">Nuevas usuarias</div>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="text-align:center;padding:16px;background:#efe7dd;border-radius:12px;">
                    <div style="font-size:32px;color:#d1774c;font-family:Georgia,serif;">${wishlistThisMonth}</div>
                    <div style="font-size:13px;color:#a07860;margin-top:4px;">Favoritos añadidos</div>
                  </td>
                  <td width="4%"></td>
                  <td width="33%" style="text-align:center;padding:16px;background:#efe7dd;border-radius:12px;">
                    <div style="font-size:32px;color:#d1774c;font-family:Georgia,serif;">${totalProducts}</div>
                    <div style="font-size:13px;color:#a07860;margin-top:4px;">Productos en tienda</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Top este mes -->
          <tr>
            <td style="background:#FFFFFF;padding:0 32px 32px;">
              <h2 style="margin:0 0 16px;font-size:18px;color:#764b36;font-family:Georgia,serif;">
                🌸 Más deseados este mes
              </h2>
              <table width="100%" style="border-collapse:collapse;">
                ${topList(topThisMonth)}
              </table>
            </td>
          </tr>

          <!-- Top all time -->
          <tr>
            <td style="background:#FFFFFF;padding:0 32px 32px;">
              <h2 style="margin:0 0 16px;font-size:18px;color:#764b36;font-family:Georgia,serif;">
                ⭐ Más deseados de siempre
              </h2>
              <table width="100%" style="border-collapse:collapse;">
                ${topList(topAllTime)}
              </table>
            </td>
          </tr>

          <!-- Productos sin favoritos -->
          <tr>
            <td style="background:#FFFFFF;padding:0 32px 32px;border-radius:0 0 16px 16px;">
              <h2 style="margin:0 0 16px;font-size:18px;color:#764b36;font-family:Georgia,serif;">
                💤 Sin ningún favorito
              </h2>
              ${
                productsWithNoFavorites.length === 0
                  ? '<p style="color:#a07860;font-size:14px;">¡Todos los productos tienen al menos un favorito! 🎉</p>'
                  : `<table width="100%" style="border-collapse:collapse;">
                      ${productsWithNoFavorites
                        .map(
                          p => `
                        <tr>
                          <td style="padding:6px 0;color:#764b36;font-size:14px;">${p.name}</td>
                          <td style="padding:6px 0;color:#a07860;font-size:13px;text-align:right;">
                            ${p.category ?? 'sin categoría'} · ${p.price}€
                          </td>
                        </tr>`
                        )
                        .join('')}
                    </table>`
              }
            </td>
          </tr>

          <!-- Footer email -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a07860;">
                Este informe se genera automáticamente el día 1 de cada mes.<br>
                MarfilFresa 🍓
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
