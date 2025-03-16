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
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          buyer_id: string
          buyer_name: string
          created_at: string
          enable_notifications: boolean
          id: string
          is_free_consultation: boolean
          product_id: string
          product_title: string
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          buyer_id: string
          buyer_name: string
          created_at?: string
          enable_notifications?: boolean
          id?: string
          is_free_consultation?: boolean
          product_id: string
          product_title: string
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          buyer_id?: string
          buyer_name?: string
          created_at?: string
          enable_notifications?: boolean
          id?: string
          is_free_consultation?: boolean
          product_id?: string
          product_title?: string
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      astro_charts: {
        Row: {
          birth_date: string
          birth_location: string
          birth_time: string
          chart_type: string
          client_name: string
          created_at: string
          house_system: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          report_content: string | null
          report_url: string | null
          updated_at: string
          user_id: string
          zodiac_type: string
        }
        Insert: {
          birth_date: string
          birth_location: string
          birth_time: string
          chart_type: string
          client_name: string
          created_at?: string
          house_system?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          report_content?: string | null
          report_url?: string | null
          updated_at?: string
          user_id: string
          zodiac_type?: string
        }
        Update: {
          birth_date?: string
          birth_location?: string
          birth_time?: string
          chart_type?: string
          client_name?: string
          created_at?: string
          house_system?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          report_content?: string | null
          report_url?: string | null
          updated_at?: string
          user_id?: string
          zodiac_type?: string
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          is_active: boolean
          room_id: string
          started_at: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          room_id: string
          started_at?: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          room_id?: string
          started_at?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          appointment_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          sender_name: string | null
        }
        Insert: {
          appointment_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          sender_name?: string | null
        }
        Update: {
          appointment_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          sender_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_collections: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      nft_transactions: {
        Row: {
          buyer_id: string | null
          created_at: string
          id: string
          nft_id: string
          price: number
          seller_id: string
          status: string
          transaction_hash: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          nft_id: string
          price: number
          seller_id: string
          status?: string
          transaction_hash?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          id?: string
          nft_id?: string
          price?: number
          seller_id?: string
          status?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nft_transactions_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      nfts: {
        Row: {
          blockchain: string
          collection: string
          content_type: string
          created_at: string
          currency: string | null
          description: string
          file_type: string | null
          file_url: string | null
          id: string
          imageurl: string
          owner_id: string
          price: number
          status: string
          title: string
          tokenid: string | null
        }
        Insert: {
          blockchain?: string
          collection: string
          content_type?: string
          created_at?: string
          currency?: string | null
          description: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          imageurl: string
          owner_id: string
          price: number
          status?: string
          title: string
          tokenid?: string | null
        }
        Update: {
          blockchain?: string
          collection?: string
          content_type?: string
          created_at?: string
          currency?: string | null
          description?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          imageurl?: string
          owner_id?: string
          price?: number
          status?: string
          title?: string
          tokenid?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          contact_phone: string | null
          created_at: string
          description: string
          enable_paypal: boolean | null
          id: string
          image_url: string | null
          original_price: number | null
          paypal_client_id: string | null
          price: number
          price_currency: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          contact_phone?: string | null
          created_at?: string
          description: string
          enable_paypal?: boolean | null
          id?: string
          image_url?: string | null
          original_price?: number | null
          paypal_client_id?: string | null
          price: number
          price_currency?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          enable_paypal?: boolean | null
          id?: string
          image_url?: string | null
          original_price?: number | null
          paypal_client_id?: string | null
          price?: number
          price_currency?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_type: string | null
          created_at: string
          id: string
          industry: string | null
          profile_photo_url: string | null
          updated_at: string
          username: string
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          id: string
          industry?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          business_type?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          seller_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      screenplay_projects: {
        Row: {
          ai_generated_content: Json | null
          book_text: string | null
          character_description: string | null
          created_at: string
          id: string
          images: string[] | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_generated_content?: Json | null
          book_text?: string | null
          character_description?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_generated_content?: Json | null
          book_text?: string | null
          character_description?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_metadata: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
          video_path: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          video_path: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          video_path?: string
        }
        Relationships: []
      }
      wallet_addresses: {
        Row: {
          created_at: string
          crypto_type: string
          id: string
          product_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          crypto_type: string
          id?: string
          product_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          crypto_type?: string
          id?: string
          product_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_addresses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      [_ in never]: never
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
