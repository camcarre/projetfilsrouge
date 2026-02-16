/**
 * Types Supabase (PostgreSQL) – alignés CDC 4.2.3 et Phase 2 (modélisation BDD, RLS).
 * À régénérer si besoin avec : npx supabase gen types typescript --project-id <id> > src/services/supabase/database.types.ts
 */
export type AssetCategory = 'action' | 'obligation' | 'etf' | 'crypto' | 'autre'
export type KnowledgeLevel = 'debutant' | 'intermediaire' | 'avance'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          knowledge_level: KnowledgeLevel | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['portfolios']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['portfolios']['Insert']>
      }
      assets: {
        Row: {
          id: string
          portfolio_id: string
          name: string
          symbol: string
          category: AssetCategory
          quantity: number
          unit_price: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['assets']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
