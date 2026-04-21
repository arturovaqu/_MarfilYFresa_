"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, ShoppingBag, Users, MessageCircle, Heart, Ticket } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  badge?: number
}

interface AdminSidebarProps {
  unreadContacts: number
  onNavigate?: () => void
}

export function AdminSidebar({ unreadContacts, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/productos", label: "Productos", icon: Package },
    { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
    { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    { href: "/admin/favoritos", label: "Favoritos", icon: Heart },
    { href: "/admin/codigos", label: "Códigos", icon: Ticket },
    { href: "/admin/contactos", label: "Contactos", icon: MessageCircle, badge: unreadContacts },
  ]

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  return (
    <nav className="w-52 shrink-0 bg-brown flex flex-col py-4 px-3 gap-1 h-full">
      {navItems.map((item) => {
        const active = isActive(item)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-terracota text-white"
                : "text-cream/75 hover:bg-white/10 hover:text-cream"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="rounded-full bg-terracota px-2 py-0.5 text-xs text-white leading-none">
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
