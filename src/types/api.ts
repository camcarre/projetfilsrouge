/**
 * Types partagés pour les réponses API et les résultats de services.
 */

export interface ApiResult<T> {
  data: T | null
  error: Error | null
}

export interface ApiError {
  message: string
  status?: number
}

export type AuthResult = ApiResult<{ user: { id: string; email: string }; token: string }>

export type SessionUser = {
  id: string
  email: string
  displayName?: string
  knowledgeLevel?: 'debutant' | 'intermediaire' | 'avance'
}
