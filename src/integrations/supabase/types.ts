export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agendas: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          project_id: string
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
          voting_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          project_id: string
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          voting_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          project_id?: string
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          voting_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          agenda_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          id: string
          required_approval: number | null
          title: string
        }
        Insert: {
          agenda_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          required_approval?: number | null
          title: string
        }
        Update: {
          agenda_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          required_approval?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          communications_address: string | null
          company_name: string | null
          created_at: string
          credits: number | null
          email: string
          ibc_registration_number: string | null
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          communications_address?: string | null
          company_name?: string | null
          created_at?: string
          credits?: number | null
          email: string
          ibc_registration_number?: string | null
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          communications_address?: string | null
          company_name?: string | null
          created_at?: string
          credits?: number | null
          email?: string
          ibc_registration_number?: string | null
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          admin_id: string
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          credits: number
          description: string
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits: number
          description: string
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits?: number
          description?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      voter_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp: string
          used: boolean
          voter_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp: string
          used?: boolean
          voter_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp?: string
          used?: boolean
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voter_otps_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "voters"
            referencedColumns: ["id"]
          },
        ]
      }
      voters: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          project_id: string
          status: string | null
          updated_at: string
          voter_id: string | null
          voting_weight: number | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          project_id: string
          status?: string | null
          updated_at?: string
          voter_id?: string | null
          voting_weight?: number | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          project_id?: string
          status?: string | null
          updated_at?: string
          voter_id?: string | null
          voting_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "voters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          agenda_id: string
          created_at: string
          id: string
          option_id: string
          value: string | null
          voter_id: string
          voting_weight: number | null
        }
        Insert: {
          agenda_id: string
          created_at?: string
          id?: string
          option_id: string
          value?: string | null
          voter_id: string
          voting_weight?: number | null
        }
        Update: {
          agenda_id?: string
          created_at?: string
          id?: string
          option_id?: string
          value?: string | null
          voter_id?: string
          voting_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_agenda_id_fkey"
            columns: ["agenda_id"]
            isOneToOne: false
            referencedRelation: "agendas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "voters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_voter_otp: {
        Args: {
          v_voter_id: string
          v_email: string
          v_otp: string
          v_expires_at: string
        }
        Returns: boolean
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      verify_voter_otp: {
        Args: { v_voter_id: string; v_otp: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "super_admin" | "admin" | "voter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["super_admin", "admin", "voter"],
    },
  },
} as const
