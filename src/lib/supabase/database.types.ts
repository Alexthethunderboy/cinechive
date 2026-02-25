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
          bio: string | null;
          trakt_token: string | null;
          lastfm_username: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          trakt_token?: string | null;
          lastfm_username?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          trakt_token?: string | null;
          lastfm_username?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
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
          activity_type: 'entry' | 're_archive';
          original_entry_id: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MoodTag = Database['public']['Tables']['mood_tags']['Row'];
export type MediaEntry = Database['public']['Tables']['media_entries']['Row'];
export type ReArchive = Database['public']['Tables']['re_archives']['Row'];
export type FeedActivity = Database['public']['Views']['feed_activity']['Row'];
export type MediaType = MediaEntry['media_type'];
