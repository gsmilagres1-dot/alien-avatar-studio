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
      avatar_drafts: {
        Row: {
          avatar_url: string
          created_at: string
          id: string
          payment_id: string | null
          prompt_seed: string | null
          user_id: string
          variant_index: number
        }
        Insert: {
          avatar_url: string
          created_at?: string
          id?: string
          payment_id?: string | null
          prompt_seed?: string | null
          user_id: string
          variant_index?: number
        }
        Update: {
          avatar_url?: string
          created_at?: string
          id?: string
          payment_id?: string | null
          prompt_seed?: string | null
          user_id?: string
          variant_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "avatar_drafts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ficha_transactions: {
        Row: {
          created_at: string
          delta: number
          id: string
          meta: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          meta?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          meta?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      identities: {
        Row: {
          alien_name: string
          avatar_url: string
          birthdate: string
          created_at: string
          galactic_birth: string
          gender: string
          human_name: string
          id: string
          id_number: string
          license_class: string
          payment_id: string | null
          planet_id: string
          rank: string
          ship_category: string | null
          ship_image_url: string | null
          species: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alien_name: string
          avatar_url: string
          birthdate: string
          created_at?: string
          galactic_birth: string
          gender: string
          human_name: string
          id?: string
          id_number: string
          license_class: string
          payment_id?: string | null
          planet_id: string
          rank: string
          ship_category?: string | null
          ship_image_url?: string | null
          species: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alien_name?: string
          avatar_url?: string
          birthdate?: string
          created_at?: string
          galactic_birth?: string
          gender?: string
          human_name?: string
          id?: string
          id_number?: string
          license_class?: string
          payment_id?: string | null
          planet_id?: string
          rank?: string
          ship_category?: string | null
          ship_image_url?: string | null
          species?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          attempts_used: number
          completed_at: string | null
          created_at: string
          current_level: number
          final_destination_kind: string | null
          final_destination_name: string | null
          id: string
          identity_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts_used?: number
          completed_at?: string | null
          created_at?: string
          current_level?: number
          final_destination_kind?: string | null
          final_destination_name?: string | null
          id?: string
          identity_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts_used?: number
          completed_at?: string | null
          created_at?: string
          current_level?: number
          final_destination_kind?: string | null
          final_destination_name?: string | null
          id?: string
          identity_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journeys_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: true
            referencedRelation: "identities"
            referencedColumns: ["id"]
          },
        ]
      }
      passports: {
        Row: {
          id: string
          issued_at: string
          level: number
          origin_planet: string
          passport_number: string
          payment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          issued_at?: string
          level?: number
          origin_planet: string
          passport_number: string
          payment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          issued_at?: string
          level?: number
          origin_planet?: string
          passport_number?: string
          payment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          credits_granted: number
          credits_remaining: number
          currency: string
          env: string
          id: string
          kind: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          credits_granted?: number
          credits_remaining?: number
          currency?: string
          env?: string
          id?: string
          kind?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          credits_granted?: number
          credits_remaining?: number
          currency?: string
          env?: string
          id?: string
          kind?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          created_at: string
          id: string
          journey_id: string | null
          level: number
          passed: boolean
          questions: Json | null
          score: number
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          id?: string
          journey_id?: string | null
          level: number
          passed?: boolean
          questions?: Json | null
          score: number
          total: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          id?: string
          journey_id?: string | null
          level?: number
          passed?: boolean
          questions?: Json | null
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number | null
          team_id: string
          token: string
          uses: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          team_id: string
          token: string
          uses?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          team_id?: string
          token?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          country_code: string | null
          created_at: string
          description: string | null
          fichas: number
          flag_emoji: string | null
          id: string
          leader_id: string
          members_count: number
          name: string
          score: number
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          fichas?: number
          flag_emoji?: string | null
          id?: string
          leader_id: string
          members_count?: number
          name: string
          score?: number
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          fichas?: number
          flag_emoji?: string | null
          id?: string
          leader_id?: string
          members_count?: number
          name?: string
          score?: number
          updated_at?: string
        }
        Relationships: []
      }
      visas: {
        Row: {
          destination_id: string
          destination_name: string
          expires_at: string | null
          id: string
          issued_at: string
          journey_id: string | null
          kind: string
          payment_id: string | null
          status: string
          tier: string
          transport: string
          user_id: string
        }
        Insert: {
          destination_id: string
          destination_name: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          journey_id?: string | null
          kind?: string
          payment_id?: string | null
          status?: string
          tier?: string
          transport: string
          user_id: string
        }
        Update: {
          destination_id?: string
          destination_name?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          journey_id?: string | null
          kind?: string
          payment_id?: string | null
          status?: string
          tier?: string
          transport?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visas_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          alimento_doce: number
          alimento_liquido: number
          alimento_salgado: number
          aneis: number
          created_at: string
          fichas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alimento_doce?: number
          alimento_liquido?: number
          alimento_salgado?: number
          aneis?: number
          created_at?: string
          fichas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alimento_doce?: number
          alimento_liquido?: number
          alimento_salgado?: number
          aneis?: number
          created_at?: string
          fichas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_fichas: {
        Args: {
          _delta: number
          _meta?: Json
          _reason: string
          _user_id: string
        }
        Returns: number
      }
      create_team: {
        Args: {
          _country_code?: string
          _description?: string
          _flag_emoji?: string
          _name: string
        }
        Returns: string
      }
      is_team_leader: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      join_team_via_invite: { Args: { _token: string }; Returns: string }
      leave_team: { Args: { _team_id: string }; Returns: undefined }
    }
    Enums: {
      team_role: "leader" | "member"
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
      team_role: ["leader", "member"],
    },
  },
} as const
