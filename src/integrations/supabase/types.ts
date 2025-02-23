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
      articles: {
        Row: {
          author: string | null
          content: string
          content_id: number | null
          id: number
        }
        Insert: {
          author?: string | null
          content: string
          content_id?: number | null
          id?: number
        }
        Update: {
          author?: string | null
          content?: string
          content_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_item_tags: {
        Row: {
          content_id: number
          created_at: string | null
          tag_id: number
        }
        Insert: {
          content_id: number
          created_at?: string | null
          tag_id: number
        }
        Update: {
          content_id?: number
          created_at?: string | null
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_item_tags_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "content_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          created_at: string | null
          date: string | null
          description: string | null
          id: number
          image_url: string | null
          link: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          link: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          link?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_tags: {
        Row: {
          created_at: string | null
          id: number
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          type?: string
        }
        Relationships: []
      }
      global_config: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      people: {
        Row: {
          avatar_url: string | null
          bio: string | null
          content_id: number | null
          full_name: string
          id: number
          social_links: Json | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          content_id?: number | null
          full_name: string
          id?: number
          social_links?: Json | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          content_id?: number | null
          full_name?: string
          id?: number
          social_links?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "people_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          audio_url: string
          content_id: number | null
          duration: number | null
          episode_number: number | null
          id: number
          season_number: number | null
        }
        Insert: {
          audio_url: string
          content_id?: number | null
          duration?: number | null
          episode_number?: number | null
          id?: number
          season_number?: number | null
        }
        Update: {
          audio_url?: string
          content_id?: number | null
          duration?: number | null
          episode_number?: number | null
          id?: number
          season_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "podcasts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: number
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          type?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          content_id: number | null
          duration: number | null
          id: number
          thumbnail_url: string | null
          video_url: string
        }
        Insert: {
          content_id?: number | null
          duration?: number | null
          id?: number
          thumbnail_url?: string | null
          video_url: string
        }
        Update: {
          content_id?: number | null
          duration?: number | null
          id?: number
          thumbnail_url?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      content_type: "article" | "video" | "podcast" | "person"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
