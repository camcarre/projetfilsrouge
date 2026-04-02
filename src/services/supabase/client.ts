/**
 * Client Supabase unique (singleton) – CDC 4.2.3 Backend Supabase (BaaS).
 * - PostgreSQL + Auth + Realtime + Storage + Edge Functions.
 * - Sécurité CDC 4.4 : uniquement clé anon (jamais service_role en front), TLS/HTTPS géré par Supabase.
 */
import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

let client: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (client) return client
  if (!env.supabase.isConfigured()) return null
  client = createClient(env.supabase.url, env.supabase.anonKey, {
    auth: {
      persistSession: true,
      storageKey: 'finance-pwa-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return client
}

/** Client Supabase typé (null si env non configuré). À utiliser via les services (authService, portfolioService, etc.). */
export const supabase = getSupabaseClient()

/** À true quand Supabase est configuré (.env rempli avec URL + anon key valides). */
export const isSupabaseConfigured = (): boolean => env.supabase.isConfigured()
