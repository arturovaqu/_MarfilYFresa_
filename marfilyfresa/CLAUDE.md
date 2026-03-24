# MarfilFresa 🍓 — Guía del Proyecto

## Descripción
Tienda online de joyería colorida y divertida, con novedades ocasionales
de bolsos y sudaderas. Sin pagos online — los pedidos funcionan como
reservas (el cliente pide, la dueña confirma y gestiona el cobro manualmente).

## Stack
- Next.js 16 con App Router y TypeScript estricto
- Supabase (base de datos, auth y storage de imágenes)
- Tailwind CSS v4 para estilos
- Vercel para deployment (con cron jobs)
- Resend para emails (pedidos, contacto, informe mensual)
- Claude API para análisis de posts de Instagram

## Clientes de Supabase — MUY IMPORTANTE
Hay DOS archivos de cliente, nunca mezclarlos:
- /lib/supabase-server.ts → SOLO para Server Components y Route Handlers
  Exporta: createSupabaseServerClient(), createSupabaseAdminClient()
- /lib/supabase.ts → SOLO para componentes con "use client"
  Exporta: createSupabaseBrowserClient()

## Identidad visual
- Fondo principal: #efe7dd
- Terracota:       #d1774c  (botones, badges, acentos)
- Marrón:          #764b36  (hover, bordes, texto, footer, admin header)
- Blanco:          #FFFFFF  (tarjetas y formularios)
- Texto principal: #764b36
- Texto suave:     #a07860
- Fuente títulos:  DM Serif Display (Google Fonts)
- Fuente cuerpo:   DM Sans (Google Fonts)
- Estilo: clean girl, minimalista cálido, joyería colorida y divertida

## Estructura de carpetas
- /app/page.tsx               → Inicio: Hero + novedades (is_featured=true)
- /app/catalogo/page.tsx      → Catálogo con filtros
- /app/nosotros/page.tsx      → Página sobre la marca
- /app/contacto/page.tsx      → Formulario de contacto
- /app/favoritos/page.tsx     → Wishlist (requiere login)
- /app/carrito/page.tsx       → Checkout del pedido
- /app/auth/page.tsx          → Login y registro
- /app/admin/page.tsx         → Dashboard admin
- /app/admin/productos/       → CRUD de productos
- /app/admin/pedidos/         → Gestión de pedidos
- /app/admin/usuarios/        → Lista de usuarios
- /app/admin/contactos/       → Mensajes de contacto
- /app/api/monthly-report/    → Cron informe mensual
- /app/api/analyze-instagram/ → Análisis con Claude
- /app/api/notify-order/      → Email nuevo pedido
- /app/api/contact/           → Guardar contacto + email
- /components/navbar.tsx      → Navbar con todos los iconos
- /components/cart-drawer.tsx → Drawer lateral del carrito
- /components/admin/          → Componentes del panel admin
- /context/shop-context.tsx   → Estado global carrito + favoritos
- /lib/supabase.ts            → Cliente browser
- /lib/supabase-server.ts     → Cliente servidor
- /lib/database.types.ts      → Tipos de Supabase
- /lib/types.ts               → Tipos del dominio

## Base de datos (Supabase)

### products
- id (uuid PK), name (text), description (text), price (numeric)
- image_url (text) → Supabase Storage bucket "products"
- stock (integer) → se descuenta al confirmar pedido
- category (text): anillos/collares/pulseras/pendientes/bolsos/sudaderas/otros
- attributes (jsonb), is_featured (boolean), is_on_sale (boolean)
- created_at (timestampz)

### profiles
- id (uuid PK, referencia auth.users), role (text: 'admin' o 'user')

### wishlist
- id (uuid PK), user_id (uuid), product_id (uuid nullable)
- product_name (text), created_at (timestampz)

### orders
- id (uuid PK), order_number (text, formato MF-YYYY-NNNN)
- user_id (uuid), total_amount (numeric)
- status (text): pending/confirmed/shipped/delivered/cancelled
- customer_name (text), customer_phone (text)
- customer_address (text), notes (text), created_at (timestampz)

### order_items
- id (uuid PK), order_id (uuid), product_id (uuid)
- quantity (integer), price_at_time (numeric)

### contacts
- id (uuid PK), name (text), email (text), subject (text)
- message (text), read (boolean default false), created_at (timestampz)

SQL para crear contacts:
CREATE TABLE contacts (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

## Lógica de pedidos
1. Carrito en memoria (shop-context)
2. Al pedir → verificar stock de cada producto
3. Si no hay stock → error claro al usuario
4. Si hay stock → generar MF-YYYY-NNNN → crear order + order_items
5. Descontar stock: UPDATE products SET stock = stock - quantity
6. Email al cliente + email a ADMIN_EMAIL

## Navbar (todos los iconos funcionales)
- Logo → /
- Links: Inicio / Catálogo / Nosotros / Contacto
- Instagram → nueva pestaña
- WhatsApp → wa.me/NUMERO nueva pestaña
- Corazón con contador → /favoritos (requiere login)
- Carrito con contador → abre CartDrawer
- Perfil: si logueado → menú (Mi cuenta + Cerrar sesión), si no → /auth

## Panel Admin (/admin) — solo role = 'admin'
- /admin → Dashboard con estadísticas
- /admin/productos → CRUD + importar Instagram
- /admin/pedidos → ver todos, cambiar estado, detalle
- /admin/usuarios → ver todos, cambiar rol
- /admin/contactos → mensajes, marcar leído, badge no leídos

## Emails via Resend
- ADMIN_EMAIL = arthur.va.qu@gmail.com
- Nuevo pedido → email cliente + email admin
- Nuevo contacto → email a arthur.va.qu@gmail.com + guarda en BD
- Informe mensual → día 1 de cada mes a las 9:00

## Variables de entorno (.env.local)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- RESEND_API_KEY
- ADMIN_EMAIL=arthur.va.qu@gmail.com
- CRON_SECRET
- NEXT_PUBLIC_SITE_URL

## Reglas de código
- NUNCA hardcodear claves de API
- TypeScript estricto con tipos siempre definidos
- "use client" solo cuando sea necesario
- Importar de @/lib/supabase-server en servidor, @/lib/supabase en cliente
- Al terminar → npm run build y corregir TODOS los errores antes de acabar
