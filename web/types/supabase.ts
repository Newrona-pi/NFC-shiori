export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tags: {
        Row: {
          id: string
          owner_user_id: string
          slug: string
          display_name: string | null
          uid_hex: string | null
          latest_audio_id: string | null
          last_ctr: number | null
          last_ctr_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          slug: string
          display_name?: string | null
          uid_hex?: string | null
          latest_audio_id?: string | null
          last_ctr?: number | null
          last_ctr_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_user_id?: string
          slug?: string
          display_name?: string | null
          uid_hex?: string | null
          latest_audio_id?: string | null
          last_ctr?: number | null
          last_ctr_at?: string | null
          created_at?: string
        }
      }
      audios: {
        Row: {
          id: string
          tag_id: string
          storage_path: string
          title: string | null
          duration_ms: number | null
          mime_type: string | null
          size_bytes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          tag_id: string
          storage_path: string
          title?: string | null
          duration_ms?: number | null
          mime_type?: string | null
          size_bytes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          tag_id?: string
          storage_path?: string
          title?: string | null
          duration_ms?: number | null
          mime_type?: string | null
          size_bytes?: number | null
          created_at?: string
        }
      }
      tap_events: {
        Row: {
          id: number
          tag_id: string
          uid_hex: string
          ctr: number
          ip_hash: string | null
          created_at: string
        }
        Insert: {
          id?: number
          tag_id: string
          uid_hex: string
          ctr: number
          ip_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          tag_id?: string
          uid_hex?: string
          ctr?: number
          ip_hash?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
