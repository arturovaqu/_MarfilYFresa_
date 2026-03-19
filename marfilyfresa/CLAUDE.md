# MarfilFresa 🍓 — Guía del Proyecto

## Descripción
Tienda online de joyería colorida y divertida, con novedades ocasionales
de bolsos y sudaderas. Sin carrito ni pagos online. Los usuarios pueden
guardar productos en su wishlist y contactar por WhatsApp.

## Stack
- Next.js 14 con App Router y TypeScript
- Supabase (base de datos, auth y storage de imágenes)
- Tailwind CSS para estilos
- Vercel para deployment
- Resend para emails del informe mensual
- Claude API para análisis de posts de Instagram

## Identidad visual
- Fondo principal: #efe7dd  ← crema cálido, color base de toda la web
- Terracota:       #d1774c  ← botones, badges, acentos principales
- Marrón:          #764b36  ← hover, bordes, texto oscuro, footer
- Blanco:          #FFFFFF  ← tarjetas y formularios
- Texto principal: #764b36  ← el marrón como color de texto principal
- Texto suave:     #a07860  ← subtítulos y placeholders (marrón suave)
- Fuente títulos:  DM Serif Display (Google Fonts)
- Fuente cuerpo:   DM Sans (Google Fonts)
- Estilo: clean girl, minimalista cálido, bonito y cercano

## Estructura de carpetas
- /app                        → páginas (Next.js App Router)
  - /app/catalogo             → catálogo de productos con filtros
  - /app/favoritos            → wishlist del usuario (requiere login)
  - /app/auth                 → login y registro
  - /app/nosotros             → página sobre nosotros
  - /app/contacto             → página de contacto con WhatsApp
  - /app/admin                → panel de administración (solo admin)
  - /app/api/monthly-report   → endpoint del informe mensual (cron)
  - /app/api/analyze-instagram → endpoint para analizar posts de Instagram
- /components                 → componentes reutilizables
- /lib                        → cliente de Supabase, tipos y utilidades
- /public                     → imágenes estáticas y logo

## Base de datos (Supabase — tablas existentes)

### products
| columna      | tipo      | notas                                      |
|--------------|-----------|--------------------------------------------|
| id           | uuid      | PK, auto-generado                          |
| name         | text      | requerido                                  |
| description  | text      | opcional                                   |
| price        | numeric   | requerido                                  |
| image_url    | text      | URL de Supabase Storage                    |
| stock        | integer   | opcional                                   |
| created_at   | timestampz| auto                                       |
| category     | text      | anillos / collares / pulseras / pendientes / bolsos / sudaderas / otros |
| attributes   | jsonb     | datos extra flexibles (color, material...) |
| is_featured  | boolean   | aparece en la sección novedades del inicio |
| is_on_sale   | boolean   | muestra badge de oferta                    |

### profiles
| columna | tipo | notas                                           |
|---------|------|-------------------------------------------------|
| id      | uuid | PK, referencia a auth.users                     |
| role    | text | 'admin' o 'user' — controla acceso al panel     |

### wishlist
| columna      | tipo      | notas                              |
|--------------|-----------|------------------------------------|
| id           | uuid      | PK, auto-generado                  |
| user_id      | uuid      | referencia a profiles.id           |
| product_id   | uuid      | referencia a products.id (nullable)|
| product_name | text      | requerido                          |
| created_at   | timestampz| auto                               |

### orders / order_items
Tablas existentes para uso futuro. No se usan en esta versión.

## Autenticación y roles
- Supabase Auth gestiona login/registro
- Al registrarse, se crea automáticamente una fila en profiles con role = 'user'
- El panel /admin solo es accesible si profiles.role = 'admin'
- Para hacer admin a un usuario: cambiar manualmente en Supabase Dashboard

## Funcionalidades de la web

### Públicas (sin login)
- Página de inicio con Hero y sección de novedades (is_featured = true)
- Catálogo completo con filtros por categoría
- Detalle de producto
- Página sobre nosotros
- Contacto con botón de WhatsApp

### Requieren login
- Añadir/quitar productos de la wishlist
- Ver página /favoritos con todos los productos guardados

### Panel /admin (role = 'admin')
- Dashboard con estadísticas del mes
- CRUD completo de productos
- Subida de imágenes al bucket "products" de Supabase Storage
- Importar producto desde URL de Instagram:
  - Pega la URL del post
  - Claude analiza la imagen y descripción
  - Extrae nombre, precio, categoría y descripción
  - El admin revisa y confirma antes de guardar

### Informe mensual automático
- Se ejecuta el día 1 de cada mes a las 9:00 AM (Vercel Cron)
- Envía email a ADMIN_EMAIL con:
  - Nuevos usuarios del mes
  - Productos añadidos a wishlist ese mes
  - Top 5 productos más wishlisted del mes
  - Top 5 productos más wishlisted en total
  - Productos sin ningún favorito

## Variables de entorno necesarias
Todas están en .env.local (nunca subir a GitHub):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- RESEND_API_KEY
- ADMIN_EMAIL
- CRON_SECRET

## Reglas importantes
- NUNCA hardcodear claves de API en el código
- Usar siempre TypeScript con tipos definidos
- Los componentes de cliente llevan "use client" al principio
- Los componentes de servidor hacen fetch directo a Supabase
- Las imágenes de productos se suben al bucket "products" de Supabase Storage
- Al crear un producto desde Instagram, la imagen se descarga y se re-sube a Storage
