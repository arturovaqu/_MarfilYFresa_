import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderItem {
  quantity: number
  price_at_time: number
  products: { name: string; image_url: string | null } | null
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = (await req.json()) as { orderId: string }

    if (!orderId) {
      return NextResponse.json({ error: "orderId requerido" }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()

    // Fetch order with items + products
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select(
        `id, order_number, customer_name, customer_email, total_amount,
         order_items ( quantity, price_at_time, products ( name, image_url ) )`
      )
      .eq("id", orderId)
      .single() as unknown as {
        data: {
          id: string
          order_number: string | null
          customer_name: string | null
          customer_email: string | null
          total_amount: number
          order_items: OrderItem[]
        } | null
        error: unknown
      }

    if (orderError || !order) {
      console.error("Error fetching order:", orderError)
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 })
    }

    if (!order.customer_email) {
      return NextResponse.json({ error: "El pedido no tiene email del cliente" }, { status: 400 })
    }

    const customerName = order.customer_name ?? "clienta"
    const orderNumber = order.order_number ?? order.id.slice(0, 8)
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

    await resend.emails.send({
      from: "MarfilFresa <onboarding@resend.dev>",
      to: order.customer_email,
      subject: `Tu pedido MarfilFresa está en camino 🍓`,
      html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#efe7dd;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#efe7dd;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:#d1774c;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#fff;">MarfilFresa 🍓</h1>
            <p style="margin:8px 0 0;color:#ffe8dc;font-size:15px;">¡Tu pedido está en camino!</p>
          </td>
        </tr>

        <tr>
          <td style="background:#fff;padding:32px;">
            <h2 style="margin:0 0 12px;font-size:18px;color:#764b36;">Hola, ${customerName} 🎉</h2>
            <p style="margin:0 0 8px;font-size:14px;color:#a07860;line-height:1.6;">
              Buenas noticias — tu pedido
              <strong style="color:#764b36;font-family:monospace;">${orderNumber}</strong>
              ya está en camino. En breve lo recibirás en tu dirección.
            </p>
            <p style="margin:0;font-size:14px;color:#a07860;line-height:1.6;">
              Si tienes cualquier duda, escríbenos por
              <a href="https://wa.me/34612345678" style="color:#d1774c;text-decoration:none;">WhatsApp</a>
              y te respondemos enseguida. 🍓
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#fff;padding:0 32px 32px;border-radius:0 0 16px 16px;">
            <h2 style="margin:0 0 12px;font-size:15px;color:#764b36;">Resumen de tu pedido</h2>
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

        <tr>
          <td style="padding:0 24px 24px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a07860;">MarfilFresa — Joyería colorida y divertida</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("notify-shipping error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
