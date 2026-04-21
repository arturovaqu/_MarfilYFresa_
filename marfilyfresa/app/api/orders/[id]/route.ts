import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/mailer"

const VALID_STATUSES = ["pending", "confirmed", "cancelled"]

interface OrderItem {
  quantity: number
  price_at_time: number
  product_id: string
  products: { name: string } | null
}

interface OrderRow {
  id: string
  order_number: string | null
  status: string | null
  customer_name: string | null
  customer_email: string | null
  customer_address: string | null
  total_amount: number
  order_items: OrderItem[]
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { status: newStatus } = body as { status: string }

  if (!VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()

  // Fetch current order (need previous status + items for side effects)
  const { data: order, error: orderError } = (await admin
    .from("orders")
    .select(
      `id, order_number, status, customer_name, customer_email, customer_address, total_amount,
       order_items ( quantity, price_at_time, product_id, products ( name ) )`
    )
    .eq("id", id)
    .single()) as unknown as { data: OrderRow | null; error: unknown }

  if (orderError || !order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
  }

  const previousStatus = order.status

  // Update status in DB
  const { error: updateError } = await admin
    .from("orders")
    .update({ status: newStatus })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json({ error: (updateError as { message: string }).message }, { status: 500 })
  }

  // ── Confirmado: email al cliente ───────────────────────────────────────────
  if (newStatus === "confirmed" && previousStatus !== "confirmed") {
    if (order.customer_email) {
      const customerName = order.customer_name ?? "clienta"
      const orderNumber = order.order_number ?? id.slice(0, 8)
      const total = Number(order.total_amount)
      const pickupPoint = order.customer_address ?? ""
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

      const itemsHtml = order.order_items
        .map(
          (item) => `
        <tr>
          <td style="padding:8px 0;color:#764b36;font-size:14px;">${item.products?.name ?? "Producto"}</td>
          <td style="padding:8px 12px;color:#a07860;font-size:14px;text-align:center;">x${item.quantity}</td>
          <td style="padding:8px 0;color:#d1774c;font-size:14px;text-align:right;">${(item.price_at_time * item.quantity).toFixed(2)} €</td>
        </tr>`
        )
        .join("")

      sendEmail({
        to: order.customer_email,
        subject: `¡Pedido ${orderNumber} confirmado! 🍓`,
        html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#efe7dd;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#efe7dd;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#d1774c;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#fff;">MarfilYFresa 🍓</h1>
            <p style="margin:8px 0 0;color:#efe7dd;font-size:15px;">¡Tu pedido está confirmado!</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px 32px 24px;">
            <h2 style="margin:0 0 8px;font-size:18px;color:#764b36;">Hola, ${customerName} 👋</h2>
            <p style="margin:0;font-size:14px;color:#a07860;line-height:1.6;">
              Hemos confirmado tu pedido <strong style="color:#764b36;font-family:monospace;">${orderNumber}</strong>.
              Pronto estará listo para que puedas recogerlo.
            </p>
          </td>
        </tr>
        ${pickupPoint ? `
        <tr>
          <td style="background:#fff;padding:0 32px 24px;">
            <div style="background:#efe7dd;border-radius:12px;padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:12px;color:#a07860;text-transform:uppercase;letter-spacing:0.05em;">Punto de recogida</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#764b36;">${pickupPoint}</p>
            </div>
          </td>
        </tr>` : ""}
        <tr>
          <td style="background:#fff;padding:0 32px 32px;border-radius:0 0 16px 16px;">
            <h2 style="margin:0 0 12px;font-size:15px;color:#764b36;">Resumen del pedido</h2>
            <table width="100%" style="border-collapse:collapse;">
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding:14px 0 0;border-top:1px solid #efe7dd;font-weight:bold;color:#764b36;font-size:14px;">Total</td>
                <td style="padding:14px 0 0;border-top:1px solid #efe7dd;font-weight:bold;color:#d1774c;font-size:16px;text-align:right;">${total.toFixed(2)} €</td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:13px;color:#a07860;">¿Tienes alguna pregunta? Escríbenos por <a href="https://wa.me/34644065770" style="color:#d1774c;">WhatsApp</a> o responde a este email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;text-align:center;">
            <a href="${siteUrl}/catalogo" style="display:inline-block;background:#d1774c;color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;">Seguir comprando 🍓</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      }).catch((e) => console.error("confirm email error:", e))
    }
  }

  // ── Cancelado: restaurar stock + email al cliente ──────────────────────────
  if (newStatus === "cancelled" && previousStatus !== "cancelled") {
    // Restaurar stock de cada producto (evita doble restauración si ya estaba cancelado)
    for (const item of order.order_items) {
      if (!item.product_id) continue
      const { data: product } = await admin
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .single()

      if (product) {
        await admin
          .from("products")
          .update({ stock: (product.stock ?? 0) + item.quantity })
          .eq("id", item.product_id)
      }
    }

    // Email de cancelación al cliente
    if (order.customer_email) {
      const customerName = order.customer_name ?? "clienta"
      const orderNumber = order.order_number ?? id.slice(0, 8)
      const total = Number(order.total_amount)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

      const itemsHtml = order.order_items
        .map(
          (item) => `
        <tr>
          <td style="padding:8px 0;color:#764b36;font-size:14px;">${item.products?.name ?? "Producto"}</td>
          <td style="padding:8px 12px;color:#a07860;font-size:14px;text-align:center;">x${item.quantity}</td>
          <td style="padding:8px 0;color:#d1774c;font-size:14px;text-align:right;">${(item.price_at_time * item.quantity).toFixed(2)} €</td>
        </tr>`
        )
        .join("")

      sendEmail({
        to: order.customer_email,
        subject: `Tu pedido ${orderNumber} ha sido cancelado`,
        html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#efe7dd;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#efe7dd;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#764b36;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#fff;">MarfilYFresa 🍓</h1>
            <p style="margin:8px 0 0;color:#efe7dd;font-size:15px;">Pedido cancelado</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px;">
            <h2 style="margin:0 0 8px;font-size:18px;color:#764b36;">Hola, ${customerName}</h2>
            <p style="margin:0;font-size:14px;color:#a07860;line-height:1.6;">
              Tu pedido <strong style="color:#764b36;font-family:monospace;">${orderNumber}</strong> ha sido cancelado.
              Si tienes alguna duda, escríbenos por
              <a href="https://wa.me/34644065770" style="color:#d1774c;text-decoration:none;">WhatsApp</a>
              o responde a este email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:0 32px 32px;border-radius:0 0 16px 16px;">
            <h2 style="margin:0 0 12px;font-size:15px;color:#764b36;">Productos del pedido</h2>
            <table width="100%" style="border-collapse:collapse;">
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding:14px 0 0;border-top:1px solid #efe7dd;font-weight:bold;color:#764b36;font-size:14px;">Total</td>
                <td style="padding:14px 0 0;border-top:1px solid #efe7dd;font-weight:bold;color:#d1774c;font-size:16px;text-align:right;">${total.toFixed(2)} €</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;text-align:center;">
            <a href="${siteUrl}/catalogo" style="display:inline-block;background:#d1774c;color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;">
              Seguir explorando 🍓
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      }).catch((e) => console.error("cancel email error:", e))
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createSupabaseAdminClient()

  // order_items se borran en cascada (FK con ON DELETE CASCADE en Supabase)
  const { error } = await admin.from("orders").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
