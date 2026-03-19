# MarfilFresa 🍓 — Guía de inicio rápido

## Antes de empezar

Asegúrate de tener instalado:
- Node.js LTS (nodejs.org)
- Git
- Cursor (cursor.com) o VS Code

---

## Orden de pasos

### 1. Crea el proyecto Next.js

```bash
cd C:\Users\TuNombre\Documents
npx create-next-app@latest marfilfresa
# TypeScript → Yes | Tailwind → Yes | App Router → Yes | el resto → No
```

### 2. Mueve estos archivos a tu proyecto

Copia los archivos que te he dado a las siguientes rutas:

```
marfilfresa/
├── CLAUDE.md                              ← raíz del proyecto
├── PROMPT_V0.txt                          ← raíz (para copiar en v0.dev)
├── vercel.json                            ← raíz del proyecto
├── .env.local.example → renombra a .env.local y rellena las claves
├── lib/
│   ├── supabase.ts
│   ├── types.ts
│   └── database.types.ts
└── app/
    └── api/
        ├── monthly-report/
        │   └── route.ts
        └── analyze-instagram/
            └── route.ts
```

### 3. Instala las dependencias

```bash
cd marfilfresa
npm install @supabase/supabase-js @supabase/ssr
npm install resend
npm install lucide-react
npm install @anthropic-ai/sdk
```

### 4. Rellena el .env.local

Abre `.env.local` y rellena todas las claves:
- Supabase: supabase.com → tu proyecto → Settings → API
- Anthropic: console.anthropic.com → API Keys
- Resend: resend.com → crea cuenta gratis → API Keys
- CRON_SECRET: cualquier string largo y aleatorio

### 5. Conecta con GitHub

```bash
git init
git add .
git commit -m "Proyecto inicial MarfilFresa"
# Crea el repo en github.com y sigue sus instrucciones
```

### 6. Diseño con v0

- Ve a v0.dev
- Copia el contenido de PROMPT_V0.txt y pégalo
- Ajusta el diseño con el chat de v0
- Exporta: `npx v0@latest add [el-codigo-que-te-da-v0]`

### 7. Desarrolla con Cursor

Abre el chat de Cursor (Ctrl+L) y empieza con:

```
Lee el archivo CLAUDE.md para entender el proyecto.
Crea lib/supabase.ts con el cliente de Supabase para 
Next.js App Router usando los archivos que ya existen en /lib.
```

Orden de tareas recomendado:
1. Catálogo de productos con filtros
2. Sistema de wishlist (favoritos)
3. Autenticación con Supabase Auth
4. Panel de administración /admin
5. Importador de Instagram en el panel admin

### 8. Deploy en Vercel

- vercel.com → Add New Project → importa tu repo de GitHub
- Añade todas las variables de .env.local en "Environment Variables"
- Deploy

---

## Hacer tu cuenta admin

Después de registrarte en la web, ve a Supabase → Table Editor → profiles,
busca tu usuario y cambia el campo `role` de `user` a `admin`.

---

## Probar el informe mensual manualmente

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" \
  https://tu-dominio.vercel.app/api/monthly-report
```

---

## Notas importantes

- El archivo `.env.local` NUNCA se sube a GitHub (está en .gitignore)
- El cron del informe mensual solo funciona en Vercel (no en local)
- Para probar el informe en local, llama al endpoint manualmente
- Las imágenes de productos van al bucket "products" de Supabase Storage
  (créalo en Supabase → Storage → New bucket → nombre: "products" → público)
