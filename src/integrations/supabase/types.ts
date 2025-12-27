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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cash_closings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cash_actual: number
          cash_system: number
          closing_date: string
          created_at: string
          difference: number
          id: number
          notes: string | null
          status: Database["public"]["Enums"]["cash_closing_status"]
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cash_actual?: number
          cash_system?: number
          closing_date?: string
          created_at?: string
          difference?: number
          id?: never
          notes?: string | null
          status?: Database["public"]["Enums"]["cash_closing_status"]
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cash_actual?: number
          cash_system?: number
          closing_date?: string
          created_at?: string
          difference?: number
          id?: never
          notes?: string | null
          status?: Database["public"]["Enums"]["cash_closing_status"]
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: number
          name: string
          phone: string | null
          total_orders: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: never
          name: string
          phone?: string | null
          total_orders?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: never
          name?: string
          phone?: string | null
          total_orders?: number
          updated_at?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: number | null
          created_at: string
          created_by: string
          description: string
          expense_date: string
          id: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          updated_at: string
        }
        Insert: {
          amount?: number
          category_id?: number | null
          created_at?: string
          created_by: string
          description: string
          expense_date?: string
          id?: never
          payment_method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: number | null
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          id?: never
          payment_method?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: number
          is_read: boolean
          message: string
          related_id: number | null
          related_table: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_read?: boolean
          message: string
          related_id?: number | null
          related_table?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          is_read?: boolean
          message?: string
          related_id?: number | null
          related_table?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: number
          method: Database["public"]["Enums"]["payment_method"]
          received_by: string | null
          transaction_id: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: never
          method?: Database["public"]["Enums"]["payment_method"]
          received_by?: string | null
          transaction_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          method?: Database["public"]["Enums"]["payment_method"]
          received_by?: string | null
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      receipt_settings: {
        Row: {
          address: string | null
          business_name: string
          created_at: string
          footer_text: string | null
          id: number
          paper_size: string
          phone: string | null
          show_logo: boolean
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
        }
        Insert: {
          address?: string | null
          business_name?: string
          created_at?: string
          footer_text?: string | null
          id?: never
          paper_size?: string
          phone?: string | null
          show_logo?: boolean
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
        }
        Update: {
          address?: string | null
          business_name?: string
          created_at?: string
          footer_text?: string | null
          id?: never
          paper_size?: string
          phone?: string | null
          show_logo?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          name: string
          price: number
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_active?: boolean
          name: string
          price?: number
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          is_active?: boolean
          name?: string
          price?: number
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string
          id: number
          price: number
          qty: number
          service_id: number | null
          service_name: string
          subtotal: number
          transaction_id: number
        }
        Insert: {
          created_at?: string
          id?: never
          price?: number
          qty?: number
          service_id?: number | null
          service_name: string
          subtotal?: number
          transaction_id: number
        }
        Update: {
          created_at?: string
          id?: never
          price?: number
          qty?: number
          service_id?: number | null
          service_name?: string
          subtotal?: number
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
      transaction_status_history: {
        Row: {
          changed_by: string
          created_at: string
          id: number
          new_status: Database["public"]["Enums"]["transaction_status"]
          old_status: Database["public"]["Enums"]["transaction_status"] | null
          transaction_id: number
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: never
          new_status: Database["public"]["Enums"]["transaction_status"]
          old_status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_id: number
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: never
          new_status?: Database["public"]["Enums"]["transaction_status"]
          old_status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_status_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: number | null
          estimated_date: string | null
          id: number
          invoice_number: string
          notes: string | null
          paid_amount: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["transaction_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id?: number | null
          estimated_date?: string | null
          id?: never
          invoice_number: string
          notes?: string | null
          paid_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["transaction_status"]
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: number | null
          estimated_date?: string | null
          id?: never
          invoice_number?: string
          notes?: string | null
          paid_amount?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["transaction_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_kasir: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "kasir"
      cash_closing_status: "pending" | "approved"
      payment_method: "cash" | "qris" | "transfer"
      payment_status: "belum_lunas" | "dp" | "lunas"
      service_type: "kiloan" | "satuan"
      transaction_status: "diterima" | "diproses" | "qc" | "selesai" | "diambil"
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
    Enums: {
      app_role: ["admin", "kasir"],
      cash_closing_status: ["pending", "approved"],
      payment_method: ["cash", "qris", "transfer"],
      payment_status: ["belum_lunas", "dp", "lunas"],
      service_type: ["kiloan", "satuan"],
      transaction_status: ["diterima", "diproses", "qc", "selesai", "diambil"],
    },
  },
} as const
