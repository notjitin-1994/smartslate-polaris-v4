// Central Supabase types. Replace with generated types via Supabase CLI when available.
// Minimal hand-written types aligned to our migrations for type safety in code.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BlueprintStatus = 'draft' | 'generating' | 'answering' | 'completed' | 'error';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string;
          full_name: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_profiles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      blueprint_generator: {
        Row: {
          id: string;
          user_id: string;
          version: number;
          static_answers: Json;
          dynamic_questions: Json;
          dynamic_questions_raw: Json;
          dynamic_answers: Json;
          blueprint_json: Json;
          blueprint_markdown: string | null;
          status: BlueprintStatus;
          questionnaire_version: number;
          completed_steps: Json;
          created_at: string;
          updated_at: string;
          title: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          version?: number;
          static_answers?: Json;
          dynamic_questions?: Json;
          dynamic_questions_raw?: Json;
          dynamic_answers?: Json;
          blueprint_json?: Json;
          blueprint_markdown?: string | null;
          status?: BlueprintStatus;
          questionnaire_version?: number;
          completed_steps?: Json;
          created_at?: string;
          updated_at?: string;
          title?: string | null;
        };
        Update: {
          static_answers?: Json;
          dynamic_questions?: Json;
          dynamic_questions_raw?: Json;
          dynamic_answers?: Json;
          blueprint_json?: Json;
          blueprint_markdown?: string | null;
          status?: BlueprintStatus;
          questionnaire_version?: number;
          completed_steps?: Json;
          updated_at?: string;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'blueprint_generator_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: unknown;
      increment_blueprint_version: unknown;
      migrate_static_answers_v1_to_v2: {
        Args: { v1_data: Json };
        Returns: Json;
      };
      validate_static_answers: unknown;
    };
    Enums: Record<string, never>;
  };
}
