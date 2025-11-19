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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      buyer_requests: {
        Row: {
          buyer_id: string
          created_at: string
          crop_name: string
          id: string
          max_price: number | null
          quantity_needed: number
          region: string
          status: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          crop_name: string
          id?: string
          max_price?: number | null
          quantity_needed: number
          region: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          crop_name?: string
          id?: string
          max_price?: number | null
          quantity_needed?: number
          region?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string | null
          completed: boolean | null
          completion_date: string | null
          created_at: string | null
          id: string
          progress: Json | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          progress?: Json | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          progress?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          active: boolean | null
          challenge_type: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          requirements: Json | null
          rewards: Json | null
          start_date: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          challenge_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          requirements?: Json | null
          rewards?: Json | null
          start_date?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          challenge_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          requirements?: Json | null
          rewards?: Json | null
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          acreage: number
          created_at: string
          crop_name: string
          expected_yield: number | null
          id: string
          planting_date: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acreage: number
          created_at?: string
          crop_name: string
          expected_yield?: number | null
          id?: string
          planting_date: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acreage?: number
          created_at?: string
          crop_name?: string
          expected_yield?: number | null
          id?: string
          planting_date?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_refresh_log: {
        Row: {
          id: string
          refreshed_at: string | null
        }
        Insert: {
          id?: string
          refreshed_at?: string | null
        }
        Update: {
          id?: string
          refreshed_at?: string | null
        }
        Relationships: []
      }
      ledger: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          item: string
          notes: string | null
          quantity: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          item: string
          notes?: string | null
          quantity?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          item?: string
          notes?: string | null
          quantity?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          crop_name: string
          id: string
          price_per_kg: number
          recorded_at: string | null
          region: string
          source: string | null
        }
        Insert: {
          crop_name: string
          id?: string
          price_per_kg: number
          recorded_at?: string | null
          region: string
          source?: string | null
        }
        Update: {
          crop_name?: string
          id?: string
          price_per_kg?: number
          recorded_at?: string | null
          region?: string
          source?: string | null
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          created_at: string
          crop_name: string
          id: string
          image_url: string | null
          location: string
          price_per_kg: number
          quantity: number
          seller_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          crop_name: string
          id?: string
          image_url?: string | null
          location: string
          price_per_kg: number
          quantity: number
          seller_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          crop_name?: string
          id?: string
          image_url?: string | null
          location?: string
          price_per_kg?: number
          quantity?: number
          seller_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read: boolean | null
          recipient_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          buyer_id: string | null
          created_at: string | null
          delivery_details: Json | null
          id: string
          listing_id: string | null
          quantity: number
          seller_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          created_at?: string | null
          delivery_details?: Json | null
          id?: string
          listing_id?: string | null
          quantity: number
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          created_at?: string | null
          delivery_details?: Json | null
          id?: string
          listing_id?: string | null
          quantity?: number
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number | null
          media_url: string | null
          shares_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          media_url?: string | null
          shares_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          media_url?: string | null
          shares_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          farm_size: number | null
          full_name: string
          id: string
          location: string
          phone: string | null
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          farm_size?: number | null
          full_name: string
          id: string
          location: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          farm_size?: number | null
          full_name?: string
          id?: string
          location?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string | null
          referrer_id: string | null
          reward_claimed: boolean | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          reward_claimed?: boolean | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          reward_claimed?: boolean | null
          status?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          order_id: string | null
          rating: number
          reviewee_id: string | null
          reviewer_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          rating: number
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          rating?: number
          reviewee_id?: string | null
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          badges: Json | null
          created_at: string | null
          last_login: string | null
          level: number | null
          streak_days: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badges?: Json | null
          created_at?: string | null
          last_login?: string | null
          level?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badges?: Json | null
          created_at?: string | null
          last_login?: string | null
          level?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboards: {
        Row: {
          avg_rating: number | null
          completed_orders: number | null
          full_name: string | null
          level: number | null
          location: string | null
          points: number | null
          streak_days: number | null
          total_comments: number | null
          total_likes_given: number | null
          total_likes_received: number | null
          total_posts: number | null
          total_reviews: number | null
          total_sales: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_referral_code: { Args: { p_user_id: string }; Returns: string }
      award_points: {
        Args: { p_action: string; p_points: number; p_user_id: string }
        Returns: undefined
      }
      complete_referral: { Args: { p_referred_id: string }; Returns: undefined }
      generate_referral_code: { Args: never; Returns: string }
      get_popular_crops: {
        Args: never
        Returns: {
          crop_name: string
          usage_count: number
        }[]
      }
      process_referral: {
        Args: { p_new_user_id: string; p_referral_code: string }
        Returns: undefined
      }
      refresh_leaderboards: { Args: never; Returns: undefined }
      update_streak: { Args: { p_user_id: string }; Returns: undefined }
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
