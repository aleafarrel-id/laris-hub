// ============================================================
// Database TypeScript types for Supabase
// IMPORTANT: Replace this with auto-generated types from Supabase CLI:
//   pnpm supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/types/database.types.ts
// ============================================================

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
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'kasir'
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'admin' | 'kasir'
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'kasir'
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          sku: string | null
          hpp: number
          selling_price: number
          description: string | null
          image_url: string | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sku?: string | null
          hpp: number
          selling_price: number
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string | null
          hpp?: number
          selling_price?: number
          description?: string | null
          image_url?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          type: 'penjualan' | 'pengeluaran'
          description: string | null
          total_amount: number
          total_profit: number
          recorded_by: string
          transaction_at: string
          expense_category: 'operasional' | 'bahan_baku' | 'lainnya' | null
          expense_items: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'penjualan' | 'pengeluaran'
          description?: string | null
          total_amount: number
          total_profit?: number
          recorded_by: string
          transaction_at?: string
          expense_category?: 'operasional' | 'bahan_baku' | 'lainnya' | null
          expense_items?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: 'penjualan' | 'pengeluaran'
          description?: string | null
          total_amount?: number
          total_profit?: number
          transaction_at?: string
          expense_category?: 'operasional' | 'bahan_baku' | 'lainnya' | null
          expense_items?: Json | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          id: string
          transaction_id: string
          product_id: string | null
          product_name: string
          product_hpp: number
          selling_price: number
          quantity: number
          subtotal: number
          profit: number
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          product_id?: string | null
          product_name: string
          product_hpp: number
          selling_price: number
          quantity: number
          subtotal?: number
          profit?: number
          created_at?: string
        }
        Update: {
          quantity?: number
          subtotal?: number
          profit?: number
        }
        Relationships: []
      }
    }
    Views: {
      daily_summary: {
        Row: {
          date: string
          total_sales_count: number
          total_revenue: number
          total_gross_profit: number
          total_expense: number
          net_cashflow: number
        }
        Relationships: []
      }
    }
    Functions: {
      delete_transaction: {
        Args: {
          p_transaction_id: string
        }
        Returns: void
      }
      get_top_products: {
        Args: {
          start_date: string
          end_date: string
          limit_n?: number
        }
        Returns: {
          product_id: string
          product_name: string
          total_qty: number
          total_revenue: number
          total_profit: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
