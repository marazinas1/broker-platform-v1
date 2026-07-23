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
      feature_flags: {
        Row: {
          config: Json
          description: string | null
          enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          config?: Json
          description?: string | null
          enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          config?: Json
          description?: string | null
          enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          accent_color: string | null
          address_city: string | null
          address_country: string | null
          address_street: string | null
          address_zip: string | null
          area_unit: string
          contact_email: string | null
          contact_phone: string | null
          country: string
          currency: string
          default_locale: string
          enabled_locales: string[]
          favicon_url: string | null
          font_body: string | null
          font_heading: string | null
          geo_lat: number | null
          geo_lng: number | null
          google_analytics_id: string | null
          google_site_verification: string | null
          id: string
          legal_impressum: Json
          legal_name: string | null
          legal_privacy: Json
          legal_terms: Json
          logo_dark_url: string | null
          logo_url: string | null
          og_default_image: string | null
          opening_hours: Json
          plausible_domain: string | null
          primary_color: string | null
          secondary_color: string | null
          site_name: string
          social: Json
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          address_zip?: string | null
          area_unit?: string
          contact_email?: string | null
          contact_phone?: string | null
          country: string
          currency?: string
          default_locale?: string
          enabled_locales?: string[]
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          google_analytics_id?: string | null
          google_site_verification?: string | null
          id?: string
          legal_impressum?: Json
          legal_name?: string | null
          legal_privacy?: Json
          legal_terms?: Json
          logo_dark_url?: string | null
          logo_url?: string | null
          og_default_image?: string | null
          opening_hours?: Json
          plausible_domain?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          site_name: string
          social?: Json
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
          address_city?: string | null
          address_country?: string | null
          address_street?: string | null
          address_zip?: string | null
          area_unit?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string
          currency?: string
          default_locale?: string
          enabled_locales?: string[]
          favicon_url?: string | null
          font_body?: string | null
          font_heading?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          google_analytics_id?: string | null
          google_site_verification?: string | null
          id?: string
          legal_impressum?: Json
          legal_name?: string | null
          legal_privacy?: Json
          legal_terms?: Json
          logo_dark_url?: string | null
          logo_url?: string | null
          og_default_image?: string | null
          opening_hours?: Json
          plausible_domain?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          site_name?: string
          social?: Json
          updated_at?: string
          whatsapp?: string | null
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
