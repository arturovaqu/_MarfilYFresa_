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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string | null
          user_id: string
          total_amount: number
          status: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          customer_address: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_number?: string | null
          user_id: string
          total_amount: number
          status?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_number?: string | null
          user_id?: string
          total_amount?: number
          status?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      contacts: {
        Row: {
          id: string
          name: string
          email: string
          subject: string | null
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject?: string | null
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          subject?: string | null
          message?: string
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      stock_requests: {
        Row: {
          id: string
          product_id: string | null
          product_name: string
          customer_email: string
          created_at: string
          notified: boolean | null
        }
        Insert: {
          id?: string
          product_id?: string | null
          product_name: string
          customer_email: string
          created_at?: string
          notified?: boolean | null
        }
        Update: {
          id?: string
          product_id?: string | null
          product_name?: string
          customer_email?: string
          created_at?: string
          notified?: boolean | null
        }
        Relationships: []
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
