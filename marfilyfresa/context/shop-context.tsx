"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  category?: string | null
}

interface ShopContextType {
  // Cart
  cartItems: CartItem[]
  cartCount: number
  cartTotal: number
  addToCart: (item: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  // Favorites
  favorites: Set<string>
  favoritesCount: number
  toggleFavorite: (productId: string, productName: string) => void
  loadFavorites: () => void
}

const ShopContext = createContext<ShopContextType | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const supabase = createSupabaseBrowserClient()

  // Load favorites from Supabase when user logs in
  useEffect(() => {
    loadFavorites()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadFavorites()
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadFavorites() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setFavorites(new Set())
      return
    }
    const { data } = await supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", user.id)
      .not("product_id", "is", null)

    if (data) {
      setFavorites(new Set(data.map((w) => w.product_id as string)))
    }
  }

  async function toggleFavorite(productId: string, productName: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Redirect to auth - handled at component level
      return
    }

    const isFav = favorites.has(productId)

    if (isFav) {
      // Remove from wishlist
      await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId)

      setFavorites((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    } else {
      // Add to wishlist
      await supabase.from("wishlist").insert({
        user_id: user.id,
        product_id: productId,
        product_name: productName,
      })

      setFavorites((prev) => new Set([...prev, productId]))
    }
  }

  // ── Cart functions ──────────────────────────────────────────────────────────

  function addToCart(item: Omit<CartItem, "quantity">) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function removeFromCart(id: string) {
    setCartItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    )
  }

  function clearCart() {
    setCartItems([])
  }

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <ShopContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        favorites,
        favoritesCount: favorites.size,
        toggleFavorite,
        loadFavorites,
      }}
    >
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error("useShop must be used inside ShopProvider")
  return ctx
}
