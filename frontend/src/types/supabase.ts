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
          subscription_tier: string;
          user_role: string;
          subscription_metadata: Json;
          role_assigned_at: string;
          role_assigned_by: string | null;
          blueprint_creation_count: number;
          blueprint_saving_count: number;
          blueprint_creation_limit: number;
          blueprint_saving_limit: number;
          blueprint_usage_metadata: Json;
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
          subscription_tier?: string;
          user_role?: string;
          subscription_metadata?: Json;
          role_assigned_at?: string;
          role_assigned_by?: string | null;
          blueprint_creation_count?: number;
          blueprint_saving_count?: number;
          blueprint_creation_limit?: number;
          blueprint_saving_limit?: number;
          blueprint_usage_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
          subscription_tier?: string;
          user_role?: string;
          subscription_metadata?: Json;
          role_assigned_at?: string;
          role_assigned_by?: string | null;
          blueprint_creation_count?: number;
          blueprint_saving_count?: number;
          blueprint_creation_limit?: number;
          blueprint_saving_limit?: number;
          blueprint_usage_metadata?: Json;
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
      presentations: {
        Row: {
          id: string;
          blueprint_id: string;
          user_id: string;
          title: string;
          description: string | null;
          author: string | null;
          settings: Json;
          metadata: Json;
          status: 'draft' | 'published' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          blueprint_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          author?: string | null;
          settings?: Json;
          metadata?: Json;
          status?: 'draft' | 'published' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          author?: string | null;
          settings?: Json;
          metadata?: Json;
          status?: 'draft' | 'published' | 'archived';
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'presentations_blueprint_id_fkey';
            columns: ['blueprint_id'];
            isOneToOne: false;
            referencedRelation: 'blueprint_generator';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'presentations_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      presentation_slides: {
        Row: {
          id: string;
          presentation_id: string;
          slide_index: number;
          slide_id: string;
          slide_type:
            | 'cover'
            | 'section'
            | 'content'
            | 'metrics'
            | 'module'
            | 'timeline'
            | 'resources'
            | 'chart';
          title: string;
          subtitle: string | null;
          content: Json;
          transition: 'fade' | 'slide' | 'zoom' | 'none';
          duration: number | null;
          speaker_notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          presentation_id: string;
          slide_index: number;
          slide_id: string;
          slide_type:
            | 'cover'
            | 'section'
            | 'content'
            | 'metrics'
            | 'module'
            | 'timeline'
            | 'resources'
            | 'chart';
          title: string;
          subtitle?: string | null;
          content?: Json;
          transition?: 'fade' | 'slide' | 'zoom' | 'none';
          duration?: number | null;
          speaker_notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slide_index?: number;
          slide_id?: string;
          slide_type?:
            | 'cover'
            | 'section'
            | 'content'
            | 'metrics'
            | 'module'
            | 'timeline'
            | 'resources'
            | 'chart';
          title?: string;
          subtitle?: string | null;
          content?: Json;
          transition?: 'fade' | 'slide' | 'zoom' | 'none';
          duration?: number | null;
          speaker_notes?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'presentation_slides_presentation_id_fkey';
            columns: ['presentation_id'];
            isOneToOne: false;
            referencedRelation: 'presentations';
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
      create_user_profile: {
        Args: {
          p_user_id: string;
          p_full_name?: string | null;
          p_first_name?: string | null;
          p_last_name?: string | null;
          p_avatar_url?: string | null;
        };
        Returns: Database['public']['Tables']['user_profiles']['Row'];
      };
      get_or_create_user_profile: {
        Args: {
          p_user_id: string;
          p_full_name?: string | null;
          p_first_name?: string | null;
          p_last_name?: string | null;
          p_avatar_url?: string | null;
        };
        Returns: Database['public']['Tables']['user_profiles']['Row'];
      };
    };
    Enums: Record<string, never>;
  };
}
