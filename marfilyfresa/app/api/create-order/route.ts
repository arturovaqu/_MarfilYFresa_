// app/api/create-order/route.ts
// Crea un pedido con verificación de stock, descuento automático y emails
//
// SQL necesario en Supabase (ejecutar una sola vez):
//   ALTER TABLE orders
//     ADD COLUMN IF NOT EXISTS order_number text,
//     ADD COLUMN IF NOT EXISTS customer_name text,
//     ADD COLUMN IF NOT EXISTS customer_phone text,
//     ADD COLUMN IF NOT EXISTS customer_address text,
//     ADD COLUMN IF NOT EXISTS notes text;

import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface CartItemPayload {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerPhone, customerAddress, notes, items, total } =
      (await req.json()) as {
        customerName: string
        customerPhone: string
        customerAddress: string
        notes?: string
        items: CartItemPayload[]
        total: number
      }

    if (!customerName || !customerPhone || !customerAddress || !items?.length) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
    }

    // Verificar autenticación
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión para hacer un pedido" }, { status: 401 })
    }

    const admin = createSupabaseAdminClient()

    // 1. Verificar stock de todos los productos
    const productIds = items.map((i) => i.id)
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, stock")
      .in("id", productIds)

    if (productsError) {
      console.error("Error fetching products:", productsError)
      return NextResponse.json({ error: "Error al verificar el stock" }, { status: 500 })
    }

    for (const item of items) {
      const product = products?.find((p) => p.id === item.id)
      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.name}` },
          { status: 400 }
        )
      }
      const available = product.stock ?? 0
      if (available < item.quantity) {
        return NextResponse.json(
          {
            error:
              available === 0
                ? `"${product.name}" está agotado.`
                : `Solo quedan ${available} unidades de "${product.name}".`,
            outOfStock: true,
          },
          { status: 400 }
        )
      }
    }

    // 2. Generar número de pedido (MF-YYYY-NNNN)
    const year = new Date().getFullYear()
    const { count } = await admin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${year}-01-01T00:00:00.000Z`)
      .lt("created_at", `${year + 1}-01-01T00:00:00.000Z`)

    const orderNumber = `MF-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`

    // 3. Crear el pedido
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        total_amount: total,
        status: "pending",
        customer_name: customerName,
        customer_email: user.email ?? null,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        notes: notes || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error("Error creating order:", orderError)
      return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 })
    }

    // 4. Crear los items del pedido
    const { error: itemsError } = await admin.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
      }))
    )

    if (itemsError) {
      console.error("Error creating order items:", itemsError)
      return NextResponse.json({ error: "Error al guardar los productos del pedido" }, { status: 500 })
    }

    // 5. Descontar stock
    for (const item of items) {
      const currentStock = products!.find((p) => p.id === item.id)!.stock ?? 0
      await admin
        .from("products")
        .update({ stock: currentStock - item.quantity })
        .eq("id", item.id)
    }

    // 6. Enviar emails (admin + cliente)
    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding:8px 0;color:#764b36;font-size:14px;">${item.name}</td>
        <td style="padding:8px 12px;color:#a07860;font-size:14px;text-align:center;">x${item.quantity}</td>
        <td style="padding:8px 0;color:#d1774c;font-size:14px;text-align:right;">${(item.price * item.quantity).toFixed(2)} €</td>
      </tr>`
      )
      .join("")

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

    await Promise.allSettled([
      // Email al admin
      resend.emails.send({
        from: "MarfilYFresa <onboarding@resend.dev>",
        to: process.env.ADMIN_EMAIL!,
        subject: `🍓 Nuevo pedido ${orderNumber} de ${customerName} — ${total.toFixed(2)} €`,
        html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#efe7dd;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#efe7dd;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#d1774c;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#fff;">MarfilYFresa 🍓</h1>
            <p style="margin:8px 0 0;color:#efe7dd;font-size:15px;">¡Nuevo pedido recibido!</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px;">
            <p style="margin:4px 0;font-size:13px;color:#a07860;">Nº pedido: <strong style="color:#764b36;font-family:monospace;">${orderNumber}</strong></p>
            <p style="margin:4px 0;font-size:13px;color:#a07860;">Total: <strong style="color:#d1774c;">${total.toFixed(2)} €</strong></p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:0 32px 32px;">
            <h2 style="margin:0 0 12px;font-size:15px;color:#764b36;">Datos del cliente</h2>
            <table width="100%">
              <tr><td style="padding:3px 0;font-size:13px;color:#a07860;width:110px;">Nombre:</td><td style="padding:3px 0;font-size:13px;color:#764b36;">${customerName}</td></tr>
              <tr><td style="padding:3px 0;font-size:13px;color:#a07860;">Email:</td><td style="padding:3px 0;font-size:13px;color:#764b36;">${user.email}</td></tr>
              <tr><td style="padding:3px 0;font-size:13px;color:#a07860;">Teléfono:</td><td style="padding:3px 0;font-size:13px;color:#764b36;">${customerPhone}</td></tr>
              <tr><td style="padding:3px 0;font-size:13px;color:#a07860;">Dirección:</td><td style="padding:3px 0;font-size:13px;color:#764b36;">${customerAddress}</td></tr>
              ${notes ? `<tr><td style="padding:3px 0;font-size:13px;color:#a07860;">Notas:</td><td style="padding:3px 0;font-size:13px;color:#764b36;">${notes}</td></tr>` : ""}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:0 32px 32px;border-radius:0 0 16px 16px;">
            <h2 style="margin:0 0 12px;font-size:15px;color:#764b36;">Productos</h2>
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
            <a href="${siteUrl}/admin/pedidos" style="display:inline-block;background:#764b36;color:#efe7dd;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;">Ver en el panel</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      }),

      // Email de confirmación al cliente
      resend.emails.send({
        from: "MarfilYFresa <onboarding@resend.dev>",
        to: user.email!,
        subject: `Pedido ${orderNumber} recibido 🍓`,
        html: `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#efe7dd;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#efe7dd;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#d1774c;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#fff;">MarfilYFresa 🍓</h1>
            <p style="margin:8px 0 0;color:#efe7dd;font-size:15px;">¡Hemos recibido tu pedido!</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px;">
            <h2 style="margin:0 0 8px;font-size:18px;color:#764b36;">Hola, ${customerName} 👋</h2>
            <p style="margin:0;font-size:14px;color:#a07860;">Tu pedido <strong style="color:#764b36;font-family:monospace;">${orderNumber}</strong> ha sido recibido correctamente. Nos pondremos en contacto contigo pronto para confirmar los detalles y el envío.</p>
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
            <p style="margin:24px 0 0;font-size:13px;color:#a07860;">¿Tienes alguna pregunta? Escríbenos por <a href="https://wa.me/34612345678" style="color:#d1774c;">WhatsApp</a> o responde a este email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;text-align:center;">
            <a href="${siteUrl}/catalogo" style="display:inline-block;background:#d1774c;color:#fff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;">Seguir comprando</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      }),
    ])

    return NextResponse.json({ ok: true, orderNumber })
  } catch (err) {
    console.error("Create order error:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
