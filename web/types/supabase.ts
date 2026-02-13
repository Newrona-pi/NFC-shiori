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
          slug: string
          display_name: string | null
          password_hash: string
          latest_audio_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          display_name?: string | null
          password_hash: string
          latest_audio_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          display_name?: string | null
          password_hash?: string
          latest_audio_id?: string | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
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
