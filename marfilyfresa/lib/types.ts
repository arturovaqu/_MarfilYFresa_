// lib/types.ts
// Tipos TypeScript generados a partir del schema de Supabase de MarfilFresa

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

export type ProductCategory =
  | 'anillos'
  | 'collares'
  | 'pulseras'
  | 'pendientes'
  | 'bolsos'
  | 'sudaderas'
  | 'otros'

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock: number | null
  created_at: string
  category: ProductCategory | null
  attributes: Record<string, unknown> | null  // jsonb flexible
  is_featured: boolean | null
  is_on_sale: boolean | null
}

// Para crear un producto nuevo (sin id ni created_at)
export type NewProduct = Omit<Product, 'id' | 'created_at'>

// Para actualizar un producto (todos los campos opcionales)
export type UpdateProduct = Partial<NewProduct>

// ─── PROFILES ────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user'

export interface Profile {
  id: string       // mismo id que auth.users
  role: UserRole | null
}

// ─── WISHLIST ─────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string | null
  product_name: string
  created_at: string
}

// Wishlist con el producto completo (join)
export interface WishlistItemWithProduct extends WishlistItem {
  products: Product | null
}

// Para añadir a la wishlist
export type NewWishlistItem = Omit<WishlistItem, 'id' | 'created_at'>

// ─── ORDERS (para uso futuro) ─────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  user_id: string
  total_amount: number
  status: OrderStatus | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  quantity: number
  price_at_time: number
}

// ─── STATS (para el dashboard de admin y el informe mensual) ──────────────────

export interface MonthlyStats {
  newUsers: number
  wishlistAddedThisMonth: number
  topProductsThisMonth: TopProduct[]
  topProductsAllTime: TopProduct[]
  productsWithNoFavorites: Product[]
}

export interface TopProduct {
  product_id: string
  product_name: string
  count: number
  product?: Product
}

// ─── INSTAGRAM IMPORT ────────────────────────────────────────────────────────

export interface InstagramAnalysisResult {
  name: string
  description: string | null
  price: number | null
  category: ProductCategory | null
  image_url: string | null  // URL original de Instagram
}
