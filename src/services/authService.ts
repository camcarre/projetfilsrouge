/**
 * Service d'authentification – API custom (ton back) ou Supabase ou mock.
 * Priorité : VITE_API_URL > Supabase > mock (non connecté).
 */
import { supabase, isSupabaseConfigured } from './supabase/client'
import { api, isCustomApiConfigured, setAuthToken, clearAuthToken } from './api/client'
import type { User } from '@/store/slices/authSlice'

export type AuthProvider = 'email' | 'google' | 'apple'

function mapToUser(u: { id: string; email?: string | null; displayName?: string; knowledgeLevel?: string }): User {
  return {
    id: u.id,
    email: u.email ?? '',
    displayName: u.displayName,
    knowledgeLevel: u.knowledgeLevel as User['knowledgeLevel'] | undefined,
  }
}

/** Connexion par email / mot de passe. */
export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  if (isCustomApiConfigured()) {
    const { data, error } = await api.post<{ user: { id: string; email?: string }; token: string }>('/auth/login', { email, password })
    if (error) return { user: null, error: new Error(error.message) }
    if (data?.token) setAuthToken(data.token)
    return { user: data?.user ? mapToUser(data.user) : null, error: null }
  }
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { user: null, error }
    return { user: data.user ? mapToUser(data.user) : null, error: null }
  }
  return { user: null, error: new Error('Aucun backend configuré (VITE_API_URL ou Supabase)') }
}

/** Inscription par email. */
export async function signUpWithEmail(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  if (isCustomApiConfigured()) {
    const { data, error } = await api.post<{ user: { id: string; email?: string }; token: string }>('/auth/register', { email, password })
    if (error) return { user: null, error: new Error(error.message) }
    if (data?.token) setAuthToken(data.token)
    return { user: data?.user ? mapToUser(data.user) : null, error: null }
  }
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { user: null, error }
    return { user: data.user ? mapToUser(data.user) : null, error: null }
  }
  return { user: null, error: new Error('Aucun backend configuré') }
}

/** Connexion OAuth (Supabase uniquement ; custom back peut gérer OAuth côté serveur). */
export async function signInWithOAuth(provider: 'google' | 'apple'): Promise<{ error: Error | null }> {
  if (isCustomApiConfigured()) {
    return { error: new Error('OAuth : redirige vers ton back (ex. GET /auth/google)') }
  }
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error: error ?? null }
  }
  return { error: new Error('Aucun backend configuré') }
}

/** Déconnexion. */
export async function signOut(): Promise<void> {
  if (isCustomApiConfigured()) {
    await api.post('/auth/logout').catch(() => {})
    clearAuthToken()
    return
  }
  if (supabase) await supabase.auth.signOut()
}

/** Récupère la session courante. */
export async function getSession(): Promise<{ user: User | null }> {
  if (isCustomApiConfigured()) {
    const { data, error } = await api.get<{ user: { id: string; email?: string; displayName?: string; knowledgeLevel?: string } }>('/auth/me')
    if (error || !data?.user) return { user: null }
    return { user: mapToUser(data.user) }
  }
  if (isSupabaseConfigured() && supabase) {
    const { data: { session } } = await supabase.auth.getSession()
    return { user: session?.user ? mapToUser(session.user) : null }
  }
  return { user: null }
}

/** Abonnement aux changements d'auth (Supabase uniquement ; custom back = pas d'abonnement temps réel). */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (isCustomApiConfigured()) {
    getSession().then(({ user }) => callback(user))
    return () => {}
  }
  if (supabase) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: { id: string; email?: string | null } } | null) => {
        callback(session?.user ? mapToUser(session.user) : null)
      }
    )
    return () => subscription.unsubscribe()
  }
  callback(null)
  return () => {}
}
