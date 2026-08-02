export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      products: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          hpp: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          selling_price: number
          sku: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hpp?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          selling_price?: number
          sku?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          hpp?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          selling_price?: number
          sku?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: 'admin' | 'kasir'
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role: 'admin' | 'kasir'
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string
          id: string
          product_hpp: number
          product_id: string | null
          product_name: string
          profit: number | null
          quantity: number
          selling_price: number
          subtotal: number | null
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_hpp: number
          product_id?: string | null
          product_name: string
          profit?: number | null
          quantity?: number
          selling_price: number
          subtotal?: number | null
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_hpp?: number
          product_id?: string | null
          product_name?: string
          profit?: number | null
          quantity?: number
          selling_price?: number
          subtotal?: number | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          description: string | null
          expense_category: string | null
          expense_items: Json | null
          id: string
          notes: string | null
          payment_method: string | null
          recorded_by: string
          status: string | null
          total_amount: number
          total_profit: number
          transaction_at: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expense_category?: string | null
          expense_items?: Json | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          recorded_by: string
          status?: string | null
          total_amount?: number
          total_profit?: number
          transaction_at?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expense_category?: string | null
          expense_items?: Json | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          recorded_by?: string
          status?: string | null
          total_amount?: number
          total_profit?: number
          transaction_at?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_summary: {
        Row: {
          date: string | null
          net_cashflow: number | null
          total_expense: number | null
          total_gross_profit: number | null
          total_pending_qris: number | null
          total_revenue: number | null
          total_revenue_qris: number | null
          total_revenue_tunai: number | null
          total_sales_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_sale_transaction: {
        Args: {
          p_items: Json
          p_notes: string
          p_payment_method?: string
          p_recorded_by: string
          p_status?: string
          p_transaction_at: string
        }
        Returns: {
          created_at: string
          description: string | null
          expense_category: string | null
          expense_items: Json | null
          id: string
          notes: string | null
          payment_method: string | null
          recorded_by: string
          status: string | null
          total_amount: number
          total_profit: number
          transaction_at: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_transaction: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      get_kpi_summary_for_range: {
        Args: {
          p_from: string
          p_to: string
          p_kasir_id?: string
        }
        Returns: {
          omzet: number
          omzet_tunai: number
          omzet_qris: number
          pending_qris: number
          pengeluaran: number
          profit: number
          transaction_count: number
        }[]
      }
      get_top_products: {
        Args: { end_date: string; limit_n?: number; start_date: string }
        Returns: {
          product_id: string
          product_name: string
          total_profit: number
          total_qty: number
          total_revenue: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      update_sale_transaction: {
        Args: {
          p_items: Json
          p_notes: string
          p_payment_method?: string
          p_status?: string
          p_transaction_at: string
          p_transaction_id: string
        }
        Returns: {
          created_at: string
          description: string | null
          expense_category: string | null
          expense_items: Json | null
          id: string
          notes: string | null
          payment_method: string | null
          recorded_by: string
          status: string | null
          total_amount: number
          total_profit: number
          transaction_at: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
