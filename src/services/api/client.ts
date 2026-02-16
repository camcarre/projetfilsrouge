/**
 * Client pour ton backend (API REST). Utilisé quand VITE_API_URL est défini.
 */
import { env } from '@/config/env'

const TOKEN_KEY = 'finance-pwa-token'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY)
}

export function isCustomApiConfigured(): boolean {
  return env.api.isConfigured()
}

function getBaseUrl(): string {
  return env.api.url
}

export interface ApiError {
  message: string
  status?: number
}

type RequestOptions = { method: string; body?: object }

async function request<T>(
  path: string,
  options: RequestOptions = { method: 'GET' }
): Promise<{ data: T | null; error: ApiError | null }> {
  const { method, body } = options
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  const token = getToken()
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let data: T | null = null
    if (text.length > 0) {
      try {
        data = JSON.parse(text) as T
      } catch {
        // pas du JSON (ex. 204)
      }
    }
    if (!res.ok) {
      const errPayload = data as unknown as { message?: string } | null
      const message = (errPayload && typeof errPayload.message === 'string')
        ? errPayload.message
        : res.statusText || `Erreur ${res.status}`
      return { data: null, error: { message, status: res.status } }
    }
    return { data, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur réseau'
    return { data: null, error: { message } }
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: object) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: object) => request<T>(path, { method: 'PUT', body }),
  delete: (path: string) => request<null>(path, { method: 'DELETE' }),
}
