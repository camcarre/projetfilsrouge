/**
 * Service stockage – CDC 4.2.3 (Supabase Storage pour fichiers et exports), 7.2 (Storage pour exports et rapports).
 */
import { supabase, isSupabaseConfigured } from './supabase/client'

const BUCKET_EXPORTS = 'exports'

/** Upload d'un fichier (export rapport, etc.). */
export async function uploadExport(
  path: string,
  file: File | Blob,
  options?: { contentType?: string }
): Promise<{ path: string | null; error: Error | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { path: null, error: new Error('Supabase non configuré (Phase 1)') }
  }
  const { data, error } = await supabase.storage
    .from(BUCKET_EXPORTS)
    .upload(path, file, { contentType: options?.contentType ?? 'application/octet-stream', upsert: true })
  if (error) return { path: null, error }
  return { path: data?.path ?? null, error: null }
}

/** URL signée pour téléchargement (exports, rapports). */
export async function getSignedDownloadUrl(path: string, expiresIn = 3600): Promise<{ url: string | null; error: Error | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { url: null, error: new Error('Supabase non configuré (Phase 1)') }
  }
  const { data, error } = await supabase.storage.from(BUCKET_EXPORTS).createSignedUrl(path, expiresIn)
  if (error) return { url: null, error }
  return { url: data?.signedUrl ?? null, error: null }
}
