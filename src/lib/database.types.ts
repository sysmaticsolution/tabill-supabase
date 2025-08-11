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
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          owner_id: string
          name: string
          category: string
          quantity: number
          unit: string
          reorder_level: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          category?: string
          quantity?: number
          unit: string
          reorder_level?: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          category?: string
          quantity?: number
          unit?: string
          reorder_level?: number
          last_updated?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      kitchen_request_items: {
        Row: {
          id: string
          kitchen_request_id: string
          inventory_item_id: string
          item_name: string
          quantity: number
          unit: string
          created_at: string
        }
        Insert: {
          id?: string
          kitchen_request_id: string
          inventory_item_id: string
          item_name: string
          quantity: number
          unit: string
          created_at?: string
        }
        Update: {
          id?: string
          kitchen_request_id?: string
          inventory_item_id?: string
          item_name?: string
          quantity?: number
          unit?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_request_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_request_items_kitchen_request_id_fkey"
            columns: ["kitchen_request_id"]
            isOneToOne: false
            referencedRelation: "kitchen_requests"
            referencedColumns: ["id"]
          }
        ]
      }
      kitchen_requests: {
        Row: {
          id: string
          owner_id: string
          requesting_staff_id: string
          requesting_staff_name: string
          status: string
          request_date: string
          fulfilled_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          requesting_staff_id: string
          requesting_staff_name: string
          status?: string
          request_date?: string
          fulfilled_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          requesting_staff_id?: string
          requesting_staff_name?: string
          status?: string
          request_date?: string
          fulfilled_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_requests_requesting_staff_id_fkey"
            columns: ["requesting_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_item_variants: {
        Row: {
          id: string
          menu_item_id: string
          name: string
          cost_price: number
          selling_price: number
          created_at: string
        }
        Insert: {
          id?: string
          menu_item_id: string
          name?: string
          cost_price?: number
          selling_price: number
          created_at?: string
        }
        Update: {
          id?: string
          menu_item_id?: string
          name?: string
          cost_price?: number
          selling_price?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_variants_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_items: {
        Row: {
          id: string
          name: string
          category: string
          part_number: string
          chef_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          part_number?: string
          chef_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          part_number?: string
          chef_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          variant_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          variant_id: string
          quantity?: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          variant_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_variants"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          table_id: string | null
          order_type: string
          subtotal: number
          sgst_rate: number
          cgst_rate: number
          sgst_amount: number
          cgst_amount: number
          total: number
          payment_status: string
          payment_method: string | null
          staff_id: string | null
          staff_name: string
          order_date: string
          created_at: string
        }
        Insert: {
          id?: string
          order_number: string
          table_id?: string | null
          order_type?: string
          subtotal?: number
          sgst_rate?: number
          cgst_rate?: number
          sgst_amount?: number
          cgst_amount?: number
          total?: number
          payment_status?: string
          payment_method?: string | null
          staff_id?: string | null
          staff_name?: string
          order_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          table_id?: string | null
          order_type?: string
          subtotal?: number
          sgst_rate?: number
          cgst_rate?: number
          sgst_amount?: number
          cgst_amount?: number
          total?: number
          payment_status?: string
          payment_method?: string | null
          staff_id?: string | null
          staff_name?: string
          order_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          }
        ]
      }
      pending_order_items: {
        Row: {
          id: string
          pending_order_id: string
          menu_item_id: string
          variant_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          pending_order_id: string
          menu_item_id: string
          variant_id: string
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          pending_order_id?: string
          menu_item_id?: string
          variant_id?: string
          quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_order_items_pending_order_id_fkey"
            columns: ["pending_order_id"]
            isOneToOne: false
            referencedRelation: "pending_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_variants"
            referencedColumns: ["id"]
          }
        ]
      }
      pending_orders: {
        Row: {
          id: string
          table_id: string
          order_type: string
          subtotal: number
          sgst_rate: number
          cgst_rate: number
          sgst_amount: number
          cgst_amount: number
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id: string
          order_type?: string
          subtotal?: number
          sgst_rate?: number
          cgst_rate?: number
          sgst_amount?: number
          cgst_amount?: number
          total?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          order_type?: string
          subtotal?: number
          sgst_rate?: number
          cgst_rate?: number
          sgst_amount?: number
          cgst_amount?: number
          total?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: true
            referencedRelation: "tables"
            referencedColumns: ["id"]
          }
        ]
      }
      procurement_items: {
        Row: {
          id: string
          owner_id: string
          name: string
          unit: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          unit: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          unit?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      procurement_order_items: {
        Row: {
          id: string
          procurement_order_id: string
          item_id: string
          item_name: string
          quantity: number
          unit: string
          price_per_unit: number
          created_at: string
        }
        Insert: {
          id?: string
          procurement_order_id: string
          item_id: string
          item_name: string
          quantity: number
          unit: string
          price_per_unit: number
          created_at?: string
        }
        Update: {
          id?: string
          procurement_order_id?: string
          item_id?: string
          item_name?: string
          quantity?: number
          unit?: string
          price_per_unit?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "procurement_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_order_items_procurement_order_id_fkey"
            columns: ["procurement_order_id"]
            isOneToOne: false
            referencedRelation: "procurement_orders"
            referencedColumns: ["id"]
          }
        ]
      }
      procurement_orders: {
        Row: {
          id: string
          owner_id: string
          supplier_id: string
          supplier_name: string
          total_amount: number
          status: string
          order_date: string
          received_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          supplier_id: string
          supplier_name: string
          total_amount?: number
          status?: string
          order_date?: string
          received_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          supplier_id?: string
          supplier_name?: string
          total_amount?: number
          status?: string
          order_date?: string
          received_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_orders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      production_logs: {
        Row: {
          id: string
          owner_id: string
          chef_id: string
          chef_name: string
          menu_item_id: string
          menu_item_name: string
          variant_name: string
          quantity_produced: number
          cost_of_production: number
          production_date: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          chef_id: string
          chef_name: string
          menu_item_id: string
          menu_item_name: string
          variant_name: string
          quantity_produced: number
          cost_of_production?: number
          production_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          chef_id?: string
          chef_name?: string
          menu_item_id?: string
          menu_item_name?: string
          variant_name?: string
          quantity_produced?: number
          cost_of_production?: number
          production_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_logs_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_logs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_members: {
        Row: {
          id: string
          owner_id: string
          name: string
          email: string
          role: string
          modules: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          email: string
          role?: string
          modules?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          email?: string
          role?: string
          modules?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          id: string
          owner_id: string
          name: string
          contact_person: string
          phone: string
          address: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          contact_person?: string
          phone: string
          address?: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          contact_person?: string
          phone?: string
          address?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tables: {
        Row: {
          id: string
          name: string
          location: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          uid: string
          email: string
          name: string
          mobile_number: string
          restaurant_name: string
          restaurant_address: string
          profile_complete: boolean
          has_completed_onboarding: boolean
          subscription_status: string
          subscription_plan: string
          trial_ends_at: string | null
          subscribed_at: string | null
          subscription_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          uid: string
          email: string
          name?: string
          mobile_number?: string
          restaurant_name?: string
          restaurant_address?: string
          profile_complete?: boolean
          has_completed_onboarding?: boolean
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
          subscribed_at?: string | null
          subscription_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          uid?: string
          email?: string
          name?: string
          mobile_number?: string
          restaurant_name?: string
          restaurant_address?: string
          profile_complete?: boolean
          has_completed_onboarding?: boolean
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
          subscribed_at?: string | null
          subscription_ends_at?: string | null
          created_at?: string
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"])[TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"])
    ? (Database["public"]["Tables"])[PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof (Database["public"]["Enums"])
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicEnumNameOrOptions["schema"]]["Enums"])
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicEnumNameOrOptions["schema"]]["Enums"])[EnumName]
  : PublicEnumNameOrOptions extends keyof (Database["public"]["Enums"])
    ? (Database["public"]["Enums"])[PublicEnumNameOrOptions]
    : never