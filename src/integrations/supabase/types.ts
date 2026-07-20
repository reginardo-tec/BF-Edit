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
      client_upload_files: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          relative_path: string
          size_bytes: number
          storage_path: string
          upload_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          relative_path: string
          size_bytes?: number
          storage_path: string
          upload_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          relative_path?: string
          size_bytes?: number
          storage_path?: string
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_upload_files_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "client_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      client_uploads: {
        Row: {
          created_at: string
          id: string
          note: string | null
          sender_email: string | null
          sender_name: string
          sender_phone: string | null
          total_bytes: number
          total_files: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          sender_email?: string | null
          sender_name: string
          sender_phone?: string | null
          total_bytes?: number
          total_files?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          sender_email?: string | null
          sender_name?: string
          sender_phone?: string | null
          total_bytes?: number
          total_files?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          subtotal_cents: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal_cents?: number
          unit_price_cents?: number
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
          },
        ]
      }
      orders: {
        Row: {
          buyer_email: string | null
          buyer_name: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          external_id: string | null
          id: string
          paid_at: string | null
          provider: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_cents: number
          shipping_service: string | null
          shipping_zip: string | null
          status: string
          total_cents: number
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          external_id?: string | null
          id?: string
          paid_at?: string | null
          provider?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          shipping_service?: string | null
          shipping_zip?: string | null
          status?: string
          total_cents?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          external_id?: string | null
          id?: string
          paid_at?: string | null
          provider?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cents?: number
          shipping_service?: string | null
          shipping_zip?: string | null
          status?: string
          total_cents?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          access_token: string | null
          created_at: string
          enabled: boolean
          extra: Json
          id: string
          provider: string
          public_key: string | null
          sandbox: boolean
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          enabled?: boolean
          extra?: Json
          id?: string
          provider: string
          public_key?: string | null
          sandbox?: boolean
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          enabled?: boolean
          extra?: Json
          id?: string
          provider?: string
          public_key?: string | null
          sandbox?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      shipping_settings: {
        Row: {
          api_token: string | null
          created_at: string
          enabled: boolean
          extra: Json
          id: string
          provider: string
          sender_name: string | null
          sender_zip: string | null
          updated_at: string
        }
        Insert: {
          api_token?: string | null
          created_at?: string
          enabled?: boolean
          extra?: Json
          id?: string
          provider: string
          sender_name?: string | null
          sender_zip?: string | null
          updated_at?: string
        }
        Update: {
          api_token?: string | null
          created_at?: string
          enabled?: boolean
          extra?: Json
          id?: string
          provider?: string
          sender_name?: string | null
          sender_zip?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          maintenance_mode: boolean
          singleton: boolean
          updated_at: string
          uploads_maintenance: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          maintenance_mode?: boolean
          singleton?: boolean
          updated_at?: string
          uploads_maintenance?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          maintenance_mode?: boolean
          singleton?: boolean
          updated_at?: string
          uploads_maintenance?: boolean
        }
        Relationships: []
      }
      students: {
        Row: {
          card_serial: string
          carga_horaria: number | null
          certificate_serial: string | null
          cpf: string | null
          created_at: string
          curso: string
          data_conclusao: string | null
          data_inicio: string | null
          email: string | null
          foto_url: string | null
          id: string
          matricula: string
          nome: string
          password_hash: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          card_serial: string
          carga_horaria?: number | null
          certificate_serial?: string | null
          cpf?: string | null
          created_at?: string
          curso: string
          data_conclusao?: string | null
          data_inicio?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          matricula: string
          nome: string
          password_hash: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          card_serial?: string
          carga_horaria?: number | null
          certificate_serial?: string | null
          cpf?: string | null
          created_at?: string
          curso?: string
          data_conclusao?: string | null
          data_inicio?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          matricula?: string
          nome?: string
          password_hash?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
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
      client_upload_is_recent: {
        Args: { _upload_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
