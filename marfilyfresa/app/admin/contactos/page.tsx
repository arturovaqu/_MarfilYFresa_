import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { ContactReadToggle } from "@/components/admin/contact-read-toggle"

interface Contact {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  read: boolean
  created_at: string
}

export default async function AdminContactosPage() {
  const admin = createSupabaseAdminClient()

  const { data: contacts } = (await admin
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false })) as { data: Contact[] | null }

  const unread = contacts?.filter((c) => !c.read).length ?? 0

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl text-text-main">Contactos</h1>
          {unread > 0 && (
            <span className="rounded-full bg-terracota px-3 py-0.5 text-xs font-medium text-white">
              {unread} sin leer
            </span>
          )}
        </div>
        <p className="text-text-soft text-sm">{contacts?.length ?? 0} mensajes</p>
      </div>

      {!contacts || contacts.length === 0 ? (
        <div className="rounded-2xl bg-white flex items-center justify-center py-16 text-text-soft text-sm">
          No hay mensajes todavía
        </div>
      ) : (
        <div className="rounded-2xl bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase w-8">Leído</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Asunto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Mensaje</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brown/5">
                {contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`transition-colors ${
                      contact.read ? "hover:bg-cream/30" : "bg-terracota/5 hover:bg-terracota/10"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <ContactReadToggle contactId={contact.id} read={contact.read} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-main">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-soft">
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:text-terracota transition-colors"
                      >
                        {contact.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-soft max-w-[160px] truncate">
                      {contact.subject ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-main max-w-xs">
                      <p className="line-clamp-2">{contact.message}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-soft whitespace-nowrap">
                      {new Date(contact.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
