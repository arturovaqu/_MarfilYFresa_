import { NextRequest, NextResponse } from "next/server"
import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const supabase = createSupabaseAdminClient()

    // Save to contacts table
    const { error: dbError } = await supabase.from("contacts").insert({
      name,
      email,
      subject: subject || null,
      message,
    })

    if (dbError) {
      console.error("Error saving contact:", dbError)
      return NextResponse.json({ error: "Error al guardar el mensaje" }, { status: 500 })
    }

    // Send email notification to admin
    await resend.emails.send({
      from: "MarfilFresa <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL!,
      subject: `Nuevo mensaje de contacto: ${subject || "Sin asunto"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #764b36;">Nuevo mensaje de contacto</h2>
          <p><strong>De:</strong> ${name} (${email})</p>
          ${subject ? `<p><strong>Asunto:</strong> ${subject}</p>` : ""}
          <p><strong>Mensaje:</strong></p>
          <blockquote style="border-left: 3px solid #d1774c; padding-left: 16px; color: #764b36;">
            ${message.replace(/\n/g, "<br>")}
          </blockquote>
          <hr style="border-color: #efe7dd; margin: 24px 0;" />
          <p style="color: #a07860; font-size: 12px;">MarfilFresa — Panel de administración</p>
        </div>
      `,
    })

    // Send confirmation email to user
    await resend.emails.send({
      from: "MarfilFresa <onboarding@resend.dev>",
      to: email,
      subject: "Hemos recibido tu mensaje 🍓",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #764b36;">¡Gracias por escribirnos, ${name}!</h2>
          <p style="color: #a07860;">Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
          ${subject ? `<p><strong>Tu asunto:</strong> ${subject}</p>` : ""}
          <p style="color: #a07860; font-size: 14px;">
            Mientras tanto, puedes explorar nuestra colección en <a href="${process.env.NEXT_PUBLIC_SITE_URL}" style="color: #d1774c;">MarfilFresa</a>.
          </p>
          <hr style="border-color: #efe7dd; margin: 24px 0;" />
          <p style="color: #a07860; font-size: 12px;">MarfilFresa 🍓 — Joyería colorida y divertida</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Contact API error:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
