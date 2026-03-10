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
      challenge_notifications: {
        Row: {
          created_at: string
          id: string
          is_global: boolean
          message: string
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_global?: boolean
          message: string
          read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_global?: boolean
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      challenge_settings: {
        Row: {
          coming_soon: boolean
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          coming_soon?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          coming_soon?: boolean
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      challenge_submissions: {
        Row: {
          caption: string | null
          challenge_week_id: string
          content_url: string
          created_at: string
          id: string
          is_monthly_winner: boolean
          is_weekly_winner: boolean
          platform: string
          status: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          caption?: string | null
          challenge_week_id: string
          content_url: string
          created_at?: string
          id?: string
          is_monthly_winner?: boolean
          is_weekly_winner?: boolean
          platform?: string
          status?: string
          updated_at?: string
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          caption?: string | null
          challenge_week_id?: string
          content_url?: string
          created_at?: string
          id?: string
          is_monthly_winner?: boolean
          is_weekly_winner?: boolean
          platform?: string
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_week_id_fkey"
            columns: ["challenge_week_id"]
            isOneToOne: false
            referencedRelation: "challenge_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_weeks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          prize_amount: number
          start_date: string
          status: string
          theme: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          prize_amount?: number
          start_date: string
          status?: string
          theme: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          prize_amount?: number
          start_date?: string
          status?: string
          theme?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_ms: number | null
          id: string
          os: string | null
          page_path: string
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          id?: string
          os?: string | null
          page_path: string
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_ms?: number | null
          id?: string
          os?: string | null
          page_path?: string
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
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
          signup_source: string | null
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
          signup_source?: string | null
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
          signup_source?: string | null
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
      arpu: {
        Row: {
          arpu_ngn: number | null
        }
        Relationships: []
      }
      avg_referrals_per_user: {
        Row: {
          avg_referrals: number | null
          total_referrals: number | null
          users_with_referrals: number | null
        }
        Relationships: []
      }
      bounce_rate: {
        Row: {
          bounce_pct: number | null
          bounced_sessions: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
      browser_breakdown: {
        Row: {
          browser: string | null
          views: number | null
          visitors: number | null
        }
        Relationships: []
      }
      challenge_leaderboard: {
        Row: {
          approved_submissions: number | null
          monthly_wins: number | null
          total_submissions: number | null
          user_email: string | null
          user_name: string | null
          weekly_wins: number | null
        }
        Relationships: []
      }
      churn_rate: {
        Row: {
          churn_pct: number | null
          deletion_requests: number | null
        }
        Relationships: []
      }
      country_distribution: {
        Row: {
          country: string | null
          users: number | null
        }
        Relationships: []
      }
      daily_page_views: {
        Row: {
          date: string | null
          views: number | null
          visitors: number | null
        }
        Relationships: []
      }
      device_breakdown: {
        Row: {
          device_type: string | null
          views: number | null
          visitors: number | null
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
      hourly_traffic: {
        Row: {
          hour: number | null
          views: number | null
          visitors: number | null
        }
        Relationships: []
      }
      paid_conversion_rate: {
        Row: {
          conversion_pct: number | null
          paid_users: number | null
          total_signups: number | null
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
      signup_source_breakdown: {
        Row: {
          percentage: number | null
          signups: number | null
          source: string | null
        }
        Relationships: []
      }
      signups_by_day_of_week: {
        Row: {
          day_name: string | null
          day_num: number | null
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
      tier_upgrade_funnel: {
        Row: {
          percentage: number | null
          tier: string | null
          users: number | null
        }
        Relationships: []
      }
      todays_signups: {
        Row: {
          count: number | null
        }
        Relationships: []
      }
      top_pages: {
        Row: {
          avg_duration_ms: number | null
          page_path: string | null
          unique_visitors: number | null
          views: number | null
        }
        Relationships: []
      }
      total_waitlist_users: {
        Row: {
          total: number | null
        }
        Relationships: []
      }
      traffic_overview: {
        Row: {
          avg_duration_ms_7d: number | null
          sessions_7d: number | null
          views_30d: number | null
          views_7d: number | null
          views_today: number | null
          visitors_30d: number | null
          visitors_7d: number | null
          visitors_today: number | null
        }
        Relationships: []
      }
      traffic_sources: {
        Row: {
          page_views: number | null
          source: string | null
          unique_visitors: number | null
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
      admin_select_monthly_winner: {
        Args: { submission_id: string }
        Returns: undefined
      }
      admin_select_weekly_winner: {
        Args: { submission_id: string }
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
      get_active_challenge: {
        Args: never
        Returns: {
          description: string
          end_date: string
          id: string
          prize_amount: number
          start_date: string
          status: string
          theme: string
          title: string
        }[]
      }
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
      update_page_view_duration: {
        Args: { p_duration_ms: number; p_id: string }
        Returns: undefined
      }
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
