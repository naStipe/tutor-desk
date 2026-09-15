export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      homework: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          feedback_at: string | null
          feedback_text: string | null
          id: string
          lesson_id: string | null
          links: Json
          status: string
          student_id: string
          subject_id: string | null
          submission_text: string | null
          submitted_at: string | null
          title: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          feedback_at?: string | null
          feedback_text?: string | null
          id?: string
          lesson_id?: string | null
          links?: Json
          status?: string
          student_id: string
          subject_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          title: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          feedback_at?: string | null
          feedback_text?: string | null
          id?: string
          lesson_id?: string | null
          links?: Json
          status?: string
          student_id?: string
          subject_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          title?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subject"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      homework_attachment: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          homework_id: string
          id: string
          size_bytes: number | null
          storage_path: string
          tutor_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          homework_id: string
          id?: string
          size_bytes?: number | null
          storage_path: string
          tutor_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          homework_id?: string
          id?: string
          size_bytes?: number | null
          storage_path?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_attachment_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_attachment_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson: {
        Row: {
          created_at: string
          currency: string | null
          end_time: string
          id: string
          meeting_url: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          price: number | null
          series_id: string | null
          start_time: string
          status: string
          student_id: string
          subject_id: string | null
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          end_time: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          price?: number | null
          series_id?: string | null
          start_time: string
          status?: string
          student_id: string
          subject_id?: string | null
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          end_time?: string
          id?: string
          meeting_url?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          price?: number | null
          series_id?: string | null
          start_time?: string
          status?: string
          student_id?: string
          subject_id?: string | null
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "lesson_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subject"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lesson_series: {
        Row: {
          created_at: string
          day_of_week: number
          duration_minutes: number
          end_date: string | null
          generated_until: string
          id: string
          notes: string | null
          start_date: string
          start_minutes: number
          status: string
          student_id: string
          subject_id: string | null
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          duration_minutes?: number
          end_date?: string | null
          generated_until?: string
          id?: string
          notes?: string | null
          start_date: string
          start_minutes: number
          status?: string
          student_id: string
          subject_id?: string | null
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          duration_minutes?: number
          end_date?: string | null
          generated_until?: string
          id?: string
          notes?: string | null
          start_date?: string
          start_minutes?: number
          status?: string
          student_id?: string
          subject_id?: string | null
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_series_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_series_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subject"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_series_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      student: {
        Row: {
          archived_at: string | null
          created_at: string
          default_currency: string | null
          default_hourly_rate: number | null
          email: string | null
          id: string
          invite_token_expires_at: string | null
          invite_token_hash: string | null
          name: string
          notes: string | null
          phone: string | null
          telegram: string | null
          tutor_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          default_currency?: string | null
          default_hourly_rate?: number | null
          email?: string | null
          id?: string
          invite_token_expires_at?: string | null
          invite_token_hash?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          telegram?: string | null
          tutor_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          default_currency?: string | null
          default_hourly_rate?: number | null
          email?: string | null
          id?: string
          invite_token_expires_at?: string | null
          invite_token_hash?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          telegram?: string | null
          tutor_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      student_subject_rate: {
        Row: {
          created_at: string
          currency: string
          hourly_rate: number
          id: string
          student_id: string
          subject_id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          hourly_rate: number
          id?: string
          student_id: string
          subject_id: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          hourly_rate?: number
          id?: string
          student_id?: string
          subject_id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_subject_rate_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subject_rate_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subject"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_subject_rate_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subject: {
        Row: {
          created_at: string
          id: string
          name: string
          tutor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tutor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutor_profile"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tutor_profile: {
        Row: {
          created_at: string
          currency: string
          default_hourly_rate: number | null
          locale: string
          name: string | null
          payment_instructions: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          default_hourly_rate?: number | null
          locale?: string
          name?: string | null
          payment_instructions?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          default_hourly_rate?: number | null
          locale?: string
          name?: string | null
          payment_instructions?: string | null
          timezone?: string
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
      accept_student_invite: { Args: { p_token: string }; Returns: string }
      submit_homework: {
        Args: { p_homework_id: string; p_submission_text: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
