import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { sendEmail } from "@/lib/mailer"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { product_id, product_name, customer_email } = body

  if (!product_name || !customer_email) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.from("stock_requests").insert({
    product_id: product_id ?? null,
    product_name: String(product_name),
    customer_email: String(customer_email).trim().toLowerCase(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Email al admin avisando de la nueva solicitud
  await sendEmail({
    to: process.env.ADMIN_EMAIL!,
    subject: `🔔 Nueva solicitud de aviso: ${product_name}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#efe7dd;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#efe7dd;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:#764b36;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
            <h1 style="margin:0;font-size:22px;color:#efe7dd;">MarfilYFresa 🍓</h1>
            <p style="margin:8px 0 0;color:#d1774c;font-size:15px;">Nueva solicitud de aviso de stock</p>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:32px;border-radius:0 0 16px 16px;">
            <p style="font-size:15px;color:#764b36;margin:0 0 16px;">
              Alguien quiere que le avises cuando este producto vuelva a estar disponible:
            </p>
            <div style="background:#efe7dd;border-radius:12px;padding:16px 20px;margin:0 0 16px;">
              <p style="margin:0;font-size:16px;font-weight:bold;color:#764b36;">${product_name}</p>
            </div>
            <p style="margin:0 0 20px;font-size:14px;color:#a07860;">
              Email del cliente: <strong style="color:#764b36;">${String(customer_email).trim().toLowerCase()}</strong>
            </p>
            <a
              href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/productos?tab=solicitudes"
              style="display:inline-block;background:#d1774c;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:50px;font-size:14px;"
            >
              Ver solicitudes
            </a>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }).catch((e) => console.error("Error enviando email de solicitud:", e))

  return NextResponse.json({ success: true })
}
