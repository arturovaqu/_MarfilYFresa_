// lib/database.types.ts
// Tipos de base de datos generados manualmente desde el schema de Supabase
// Para regenerarlos automáticamente: npx supabase gen types typescript --project-id TU_PROJECT_ID

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          stock: number | null
          created_at: string
          category: string | null
          attributes: Json | null
          is_featured: boolean | null
          is_on_sale: boolean | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          stock?: number | null
          created_at?: string
          category?: string | null
          attributes?: Json | null
          is_featured?: boolean | null
          is_on_sale?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          stock?: number | null
          created_at?: string
          category?: string | null
          attributes?: Json | null
          is_featured?: boolean | null
          is_on_sale?: boolean | null
        }
      }
      profiles: {
        Row: {
          id: string
          role: string | null
        }
        Insert: {
          id: string
          role?: string | null
        }
        Update: {
          id?: string
          role?: string | null
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          product_id: string | null
          product_name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id?: string | null
          product_name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string | null
          product_name?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: string | null
          created_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          price_at_time: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          quantity: number
          price_at_time: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          price_at_time?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
