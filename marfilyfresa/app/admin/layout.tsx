import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth?redirect=admin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string | null } | null }

  if (profile?.role !== "admin") redirect("/")

  // Unread contacts count for sidebar badge
  const admin = createSupabaseAdminClient()
  const { count: unreadContacts } = await admin
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("read", false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header */}
      <header className="bg-brown text-cream px-6 py-4 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-serif text-xl text-cream">MarfilFresa</span>
          <span className="rounded-full bg-terracota px-3 py-0.5 text-xs text-white">Admin</span>
        </div>
        <Link href="/" className="text-sm text-cream/70 hover:text-cream transition-colors">
          ← Ver tienda
        </Link>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar unreadContacts={unreadContacts ?? 0} />
        <main className="flex-1 overflow-y-auto bg-cream">
          {children}
        </main>
      </div>
    </div>
  )
}
