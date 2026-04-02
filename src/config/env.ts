/**
 * Configuration des variables d'environnement (VITE_ uniquement, exposées au client).
 * Deux backends possibles : API custom (ton serveur) ou Supabase. Si les deux sont définis, l'API custom est prioritaire.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') // sans slash final

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidSupabaseUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'https:' && u.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

export const env = {
  /** API custom (ton backend). Prioritaire si défini. */
  api: {
    url: API_URL,
    isConfigured(): boolean {
      return API_URL.length > 0 && isValidHttpUrl(API_URL)
    },
  },
  /** Supabase (utilisé seulement si VITE_API_URL n'est pas défini). */
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    isConfigured(): boolean {
      return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0 && isValidSupabaseUrl(SUPABASE_URL)
    },
  },
} as const
