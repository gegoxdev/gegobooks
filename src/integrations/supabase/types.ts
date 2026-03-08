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
      admin_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string | null
          id: string
          tier: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          tier?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tier_limits: {
        Row: {
          created_at: string
          id: string
          max_capacity: number
          tier_id: string
          tier_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_capacity?: number
          tier_id: string
          tier_label: string
        }
        Update: {
          created_at?: string
          id?: string
          max_capacity?: number
          tier_id?: string
          tier_label?: string
        }
        Relationships: []
      }
      used_payment_references: {
        Row: {
          reference: string
          tier: string
          used_at: string
          user_id: string
        }
        Insert: {
          reference: string
          tier: string
          used_at?: string
          user_id: string
        }
        Update: {
          reference?: string
          tier?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      viewer_links: {
        Row: {
          access_count: number
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          label: string
          last_accessed_at: string | null
          token: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          last_accessed_at?: string | null
          token?: string
        }
        Update: {
          access_count?: number
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string
          last_accessed_at?: string | null
          token?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          referral_code: string | null
          referrals_count: number
          referred_by: string | null
          user_type: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          waitlist_position: number | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          referral_code?: string | null
          referrals_count?: number
          referred_by?: string | null
          user_type?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          waitlist_position?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          referral_code?: string | null
          referrals_count?: number
          referred_by?: string | null
          user_type?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          waitlist_position?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      country_distribution: {
        Row: {
          country: string | null
          users: number | null
        }
        Relationships: []
      }
      growth_comparisons: {
        Row: {
          dod: number | null
          mom: number | null
          wow: number | null
          yoy: number | null
        }
        Relationships: []
      }
      paid_tier_revenue: {
        Row: {
          revenue_ngn: number | null
        }
        Relationships: []
      }
      referral_conversion: {
        Row: {
          percentage: number | null
        }
        Relationships: []
      }
      referral_leaderboard: {
        Row: {
          full_name: string | null
          referrals_count: number | null
        }
        Relationships: []
      }
      signup_growth_daily: {
        Row: {
          date: string | null
          signups: number | null
        }
        Relationships: []
      }
      tier_counts: {
        Row: {
          current_count: number | null
          max_capacity: number | null
          tier_id: string | null
          tier_label: string | null
        }
        Relationships: []
      }
      todays_signups: {
        Row: {
          count: number | null
        }
        Relationships: []
      }
      total_waitlist_users: {
        Row: {
          total: number | null
        }
        Relationships: []
      }
      user_type_distribution: {
        Row: {
          count: number | null
          user_type: string | null
        }
        Relationships: []
      }
      waitlist_projection_30d: {
        Row: {
          avg_daily_growth: number | null
          current_count: number | null
          projected_30d: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_admin_invite: {
        Args: { invite_token: string }
        Returns: undefined
      }
      admin_add_admin: {
        Args: { admin_role: string; target_email: string }
        Returns: undefined
      }
      admin_delete_user_account: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_delete_waitlist_signup: {
        Args: { signup_id: string }
        Returns: undefined
      }
      admin_list_admins: {
        Args: never
        Returns: {
          admin_id: string
          created_at: string
          email: string
          full_name: string
          role: string
          tier: string
          user_id: string
        }[]
      }
      admin_remove_admin: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_set_user_tier: {
        Args: { new_tier: string; target_email: string }
        Returns: undefined
      }
      cancel_account_deletion: { Args: never; Returns: undefined }
      check_my_admin_invite: {
        Args: never
        Returns: {
          created_at: string
          id: string
          invited_by_email: string
          role: string
        }[]
      }
      create_admin_invite: {
        Args: { invite_role: string; target_email: string }
        Returns: string
      }
      create_viewer_link: {
        Args: { link_expires_at?: string; link_label: string }
        Returns: string
      }
      delete_viewer_link: { Args: { link_id: string }; Returns: undefined }
      get_admin_role: { Args: { _user_id: string }; Returns: string }
      get_admin_signups_with_tiers: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          referral_code: string
          referrals_count: number
          referred_by: string
          tier: string
          user_type: string
          utm_source: string
          waitlist_position: number
        }[]
      }
      get_admin_user_stats: { Args: never; Returns: Json }
      get_invite_email: { Args: { invite_token: string }; Returns: string }
      get_my_signup: {
        Args: { p_email: string }
        Returns: {
          referral_code: string
          referrals_count: number
          waitlist_position: number
        }[]
      }
      get_my_waitlist_status: {
        Args: never
        Returns: {
          email: string
          full_name: string
          referral_code: string
          referrals_count: number
          user_type: string
          waitlist_position: number
        }[]
      }
      get_tier_counts: {
        Args: never
        Returns: {
          current_count: number
          max_capacity: number
          tier_id: string
          tier_label: string
        }[]
      }
      get_waitlist_growth: {
        Args: { timeframe: string }
        Returns: {
          growth_rate: number
          period: string
          signups: number
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      list_admin_invites: {
        Args: never
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by_email: string
          role: string
          status: string
          token: string
        }[]
      }
      list_viewer_links: {
        Args: never
        Returns: {
          access_count: number
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          label: string
          last_accessed_at: string
          token: string
        }[]
      }
      reactivate_viewer_link: { Args: { link_id: string }; Returns: undefined }
      request_account_deletion: { Args: never; Returns: undefined }
      revoke_admin_invite: { Args: { invite_id: string }; Returns: undefined }
      revoke_viewer_link: { Args: { link_id: string }; Returns: undefined }
      upgrade_tier: { Args: { new_tier: string }; Returns: undefined }
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
