/**
 * Point d'entrée des services backend (CDC 4.2.3 – Supabase).
 * Utiliser ces modules plutôt que d'importer le client Supabase directement (bonne pratique, une seule couche d'accès).
 */
export { supabase, isSupabaseConfigured } from './supabase/client'
export type { Database } from './supabase/database.types'
export type { AssetCategory, KnowledgeLevel } from './supabase/database.types'
export * from './authService'
export * from './portfolioService'
export * from './storageService'
export * from './edgeFunctionsService'
export * from './api/mockApi'
