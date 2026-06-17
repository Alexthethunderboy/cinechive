export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          avatar_seed: string | null;
          avatar_mode: 'image' | 'character' | null;
          avatar_character: string | null;
          avatar_animation: 'float' | 'pulse' | 'orbit' | null;
          bio: string | null;
          trakt_token: string | null;
          lastfm_username: string | null;
          date_of_birth: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_seed?: string | null;
          avatar_mode?: 'image' | 'character' | null;
          avatar_character?: string | null;
          avatar_animation?: 'float' | 'pulse' | 'orbit' | null;
          bio?: string | null;
          trakt_token?: string | null;
          lastfm_username?: string | null;
          date_of_birth?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          avatar_seed?: string | null;
          avatar_mode?: 'image' | 'character' | null;
          avatar_character?: string | null;
          avatar_animation?: 'float' | 'pulse' | 'orbit' | null;
          bio?: string | null;
          trakt_token?: string | null;
          lastfm_username?: string | null;
          date_of_birth?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      mood_tags: {
        Row: {
          id: number;
          label: string;
          emoji: string | null;
          color: string | null;
        };
        Insert: {
          id?: number;
          label: string;
          emoji?: string | null;
          color?: string | null;
        };
        Update: {
          id?: number;
          label?: string;
          emoji?: string | null;
          color?: string | null;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      media_entries: {
        Row: {
          id: string;
          user_id: string;
          media_type: 'movie' | 'tv' | 'documentary' | 'music';
          external_id: string;
          title: string;
          poster_url: string | null;
          year: number | null;
          mood_tag_id: number | null;
          notes: string | null;
          is_vault: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_type: 'movie' | 'tv' | 'documentary' | 'music';
          external_id: string;
          title: string;
          poster_url?: string | null;
          year?: number | null;
          mood_tag_id?: number | null;
          notes?: string | null;
          is_vault?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_type?: 'movie' | 'tv' | 'documentary' | 'music';
          external_id?: string;
          title?: string;
          poster_url?: string | null;
          year?: number | null;
          mood_tag_id?: number | null;
          notes?: string | null;
          is_vault?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      re_archives: {
        Row: {
          id: string;
          user_id: string;
          original_entry_id: string;
          mood_tag_id: number | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          original_entry_id: string;
          mood_tag_id?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          original_entry_id?: string;
          mood_tag_id?: number | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      
      collections: {
        Row: { id: string; user_id: string; title: string; description: string | null; is_public: boolean; share_token: string | null; created_at: string; };
        Insert: { id?: string; user_id: string; title: string; description?: string | null; is_public?: boolean; share_token?: string | null; created_at?: string; };
        Update: { id?: string; user_id?: string; title?: string; description?: string | null; is_public?: boolean; share_token?: string | null; created_at?: string; };
        Relationships: [
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      collection_items: {
        Row: { id: string; collection_id: string; media_id: string; media_type: string; title: string; poster_url: string | null; year: number | null; created_at: string; };
        Insert: { id?: string; collection_id: string; media_id: string; media_type: string; title: string; poster_url?: string | null; year?: number | null; created_at?: string; };
        Update: { id?: string; collection_id?: string; media_id?: string; media_type?: string; title?: string; poster_url?: string | null; year?: number | null; created_at?: string; };
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          }
        ];
      };
      reactions: {
        Row: { id: string; user_id: string; activity_id: string; activity_type: string; created_at: string; };
        Insert: { id?: string; user_id: string; activity_id: string; activity_type: string; created_at?: string; };
        Update: { id?: string; user_id?: string; activity_id?: string; activity_type?: string; created_at?: string; };
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      comments: {
        Row: { id: string; user_id: string; activity_id: string; activity_type: string; body: string; created_at: string; };
        Insert: { id?: string; user_id: string; activity_id: string; activity_type: string; body: string; created_at?: string; };
        Update: { id?: string; user_id?: string; activity_id?: string; activity_type?: string; body?: string; created_at?: string; };
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      dispatches: {
        Row: { id: string; user_id: string; media_refs: Json; content: string; classification: string | null; created_at: string; updated_at?: string; };
        Insert: { id?: string; user_id: string; media_refs?: Json; content: string; classification?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; user_id?: string; media_refs?: Json; content?: string; classification?: string | null; created_at?: string; updated_at?: string; };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      cine_journal: {
        Row: { id: string; user_id: string; media_id: string; media_type: string; title: string; notes: string | null; rating: number | null; created_at: string; };
        Insert: { id?: string; user_id: string; media_id: string; media_type: string; title: string; notes?: string | null; rating?: number | null; created_at?: string; };
        Update: { id?: string; user_id?: string; media_id?: string; media_type?: string; title?: string; notes?: string | null; rating?: number | null; created_at?: string; };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      echoes: {
        Row: { id: string; user_id: string; media_id: string; media_type: string; media_title: string; poster_url: string | null; trivia_id: string; trivia_text: string; category: string | null; created_at: string; };
        Insert: { id?: string; user_id: string; media_id: string; media_type: string; media_title: string; poster_url?: string | null; trivia_id: string; trivia_text: string; category?: string | null; created_at?: string; };
        Update: { id?: string; user_id?: string; media_id?: string; media_type?: string; media_title?: string; poster_url?: string | null; trivia_id?: string; trivia_text?: string; category?: string | null; created_at?: string; };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      notifications: {
        Row: { id: string; user_id: string; type: string; actor_id: string; target_id: string | null; target_type: string | null; metadata: Json | null; is_read: boolean; created_at: string; };
        Insert: { id?: string; user_id: string; type: string; actor_id: string; target_id?: string | null; target_type?: string | null; metadata?: Json | null; is_read?: boolean; created_at?: string; };
        Update: { id?: string; user_id?: string; type?: string; actor_id?: string; target_id?: string | null; target_type?: string | null; metadata?: Json | null; is_read?: boolean; created_at?: string; };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      media_metadata_cache: {
        Row: {
          tmdb_id: string;
          imdb_id: string | null;
          media_type: string;
          trivia: any[];
          last_updated: string;
        };
        Insert: {
          tmdb_id: string;
          imdb_id?: string | null;
          media_type: string;
          trivia?: any[];
          last_updated?: string;
        };
        Update: {
          tmdb_id?: string;
          imdb_id?: string | null;
          media_type?: string;
          trivia?: any[];
          last_updated?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      user_reminders: {
        Row: {
          id: string;
          user_id: string;
          media_id: string;
          media_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_id: string;
          media_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_id?: string;
          media_type?: string;
          created_at?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      media_ratings: {
        Row: {
          id: string;
          user_id: string;
          media_id: string;
          media_type: string;
          rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_id: string;
          media_type: string;
          rating: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_id?: string;
          media_type?: string;
          rating?: number;
          created_at?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      media_reactions: {
        Row: {
          id: string;
          user_id: string;
          media_id: string;
          media_type: string;
          reaction: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_id: string;
          media_type: string;
          reaction: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_id?: string;
          media_type?: string;
          reaction?: string;
          created_at?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      user_onboarding_tastes: {
        Row: {
          id: string;
          user_id: string;
          category: 'movie' | 'style' | 'creator' | 'genre';
          value: string;
          display_name: string | null;
          poster_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: 'movie' | 'style' | 'creator' | 'genre';
          value: string;
          display_name?: string | null;
          poster_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: 'movie' | 'style' | 'creator' | 'genre';
          value?: string;
          display_name?: string | null;
          poster_url?: string | null;
          created_at?: string;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
    };
    Views: {
      feed_activity: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          poster_url: string | null;
          media_type: string;
          mood_tag_id: number | null;
          created_at: string;
          activity_type: 'entry' | 're_archive' | 'dispatch' | 'echo';
          original_entry_id: string | null;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
      activity_reposts: {
        Row: {
          id: string;
          user_id: string;
          activity_id: string;
          created_at: string;
          profiles: any;
        };
        Relationships: { foreignKeyName: string; columns: string[]; isOneToOne: boolean | undefined; referencedRelation: string; referencedColumns: string[]; }[];
      };
    };
    Functions: {
      get_follow_counts: {
        Args: { target_id: string };
        Returns: { followers_count: number; following_count: number }[];
      };
      get_shared_collection: {
        Args: { p_share_token: string };
        Returns: any;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MoodTag = Database['public']['Tables']['mood_tags']['Row'];
export type MediaEntry = Database['public']['Tables']['media_entries']['Row'];
export type ReArchive = Database['public']['Tables']['re_archives']['Row'];
export type FeedActivity = Database['public']['Views']['feed_activity']['Row'];
export type MediaType = MediaEntry['media_type'];
export type UserOnboardingTaste = Database['public']['Tables']['user_onboarding_tastes']['Row'];
export type OnboardingCategory = UserOnboardingTaste['category'];
