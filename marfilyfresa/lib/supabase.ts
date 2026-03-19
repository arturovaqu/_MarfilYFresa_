// lib/supabase.ts
// Cliente de Supabase configurado para Next.js App Router
// Exporta dos clientes: uno para el servidor y otro para el cliente

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

// ─── CLIENTE PARA COMPONENTES DE SERVIDOR ────────────────────────────────────
// Úsalo en Server Components, Route Handlers y Server Actions
// Ejemplo: const supabase = await createSupabaseServerClient()

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // En Server Components no se pueden setear cookies, es normal
          }
        },
      },
    }
  )
}

// ─── CLIENTE ADMIN (SERVICE ROLE) ────────────────────────────────────────────
// Solo para operaciones privilegiadas en el servidor (informe mensual, etc.)
// NUNCA uses este cliente en el frontend
// Ejemplo: const supabaseAdmin = createSupabaseAdminClient()

export function createSupabaseAdminClient() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── CLIENTE PARA COMPONENTES DE CLIENTE ─────────────────────────────────────
// Úsalo en componentes con "use client"
// Ejemplo: const supabase = createSupabaseBrowserClient()

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
