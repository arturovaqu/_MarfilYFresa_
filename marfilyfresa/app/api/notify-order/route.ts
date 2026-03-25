// app/api/notify-order/route.ts
// Sends email to admin when a new order is placed

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      notes,
      items,
      total,
    } = await request.json()

    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding:8px 0;color:#764b36;font-size:14px;">${item.name}</td>
        <td style="padding:8px 12px;color:#a07860;font-size:14px;text-align:center;">x${item.quantity}</td>
        <td style="padding:8px 0;color:#d1774c;font-size:14px;text-align:right;">${(item.price * item.quantity).toFixed(2)} €</td>
      </tr>
    `).join('')

    await resend.emails.send({
      from: 'MarfilYFresa <pedidos@marfilfresa.com>',
      to: process.env.ADMIN_EMAIL!,
      subject: `🍓 Nuevo pedido de ${customerName} — ${total.toFixed(2)} €`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#efe7dd;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#efe7dd;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:#d1774c;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#ffffff;">MarfilYFresa 🍓</h1>
            <p style="margin:8px 0 0;color:#efe7dd;font-size:15px;">¡Nuevo pedido recibido!</p>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:32px;">
            <h2 style="margin:0 0 16px;font-size:16px;color:#764b36;">Datos del pedido</h2>
            <p style="margin:4px 0;font-size:13px;color:#a07860;">ID: <span style="color:#764b36;font-family:monospace;">${orderId}</span></p>
            <p style="margin:4px 0;font-size:13px;color:#a07860;">Total: <span style="color:#d1774c;font-weight:bold;">${total.toFixed(2)} €</span></p>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:0 32px 32px;">
            <h2 style="margin:0 0 16px;font-size:16px;color:#764b36;">Datos del cliente</h2>
            <table width="100%">
              <tr><td style="padding:4px 0;font-size:13px;color:#a07860;width:120px;">Nombre:</td><td style="padding:4px 0;font-size:13px;color:#764b36;">${customerName}</td></tr>
              <tr><td style="padding:4px 0;font-size:13px;color:#a07860;">Email:</td><td style="padding:4px 0;font-size:13px;color:#764b36;">${customerEmail}</td></tr>
              <tr><td style="padding:4px 0;font-size:13px;color:#a07860;">Teléfono:</td><td style="padding:4px 0;font-size:13px;color:#764b36;">${customerPhone}</td></tr>
              <tr><td style="padding:4px 0;font-size:13px;color:#a07860;">Dirección:</td><td style="padding:4px 0;font-size:13px;color:#764b36;">${customerAddress}</td></tr>
              ${notes ? `<tr><td style="padding:4px 0;font-size:13px;color:#a07860;">Notas:</td><td style="padding:4px 0;font-size:13px;color:#764b36;">${notes}</td></tr>` : ''}
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:0 32px 32px;border-radius:0 0 16px 16px;">
            <h2 style="margin:0 0 16px;font-size:16px;color:#764b36;">Productos</h2>
            <table width="100%" style="border-collapse:collapse;">
              ${itemsHtml}
              <tr>
                <td colspan="2" style="padding:16px 0 0;border-top:1px solid #efe7dd;font-weight:bold;color:#764b36;font-size:14px;">Total</td>
                <td style="padding:16px 0 0;border-top:1px solid #efe7dd;font-weight:bold;color:#d1774c;font-size:16px;text-align:right;">${total.toFixed(2)} €</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:24px;text-align:center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/pedidos" style="display:inline-block;background:#764b36;color:#efe7dd;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;">
              Ver en el panel
            </a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending order notification:', error)
    return NextResponse.json({ error: 'Error sending email' }, { status: 500 })
  }
}
