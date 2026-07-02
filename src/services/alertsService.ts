import { api, isCustomApiConfigured } from './api/client'
import type { AlertRule, NewAlertRule, AppNotification } from '@/types/alerts'

function notConfigured() {
  return new Error('Backend non configuré')
}

/** Liste des règles d'alerte de l'utilisateur. */
export async function listAlertRules(): Promise<{ rules: AlertRule[]; error: Error | null }> {
  if (!isCustomApiConfigured()) return { rules: [], error: notConfigured() }
  const { data, error } = await api.get<{ rules: AlertRule[] }>('/api/alerts')
  if (error) return { rules: [], error: new Error(error.message) }
  return { rules: data?.rules ?? [], error: null }
}

/** Création d'une règle d'alerte. */
export async function createAlertRule(
  rule: NewAlertRule
): Promise<{ id: number | null; error: Error | null }> {
  if (!isCustomApiConfigured()) return { id: null, error: notConfigured() }
  const { data, error } = await api.post<{ id: number }>('/api/alerts', rule)
  if (error) return { id: null, error: new Error(error.message) }
  return { id: data?.id ?? null, error: null }
}

/** Suppression d'une règle d'alerte. */
export async function deleteAlertRule(id: number): Promise<{ error: Error | null }> {
  if (!isCustomApiConfigured()) return { error: notConfigured() }
  const { error } = await api.delete(`/api/alerts/${id}`)
  if (error) return { error: new Error(error.message) }
  return { error: null }
}

/** Notifications in-app (déclenchées par les alertes au refresh portfolio). */
export async function listNotifications(): Promise<{
  notifications: AppNotification[]
  error: Error | null
}> {
  if (!isCustomApiConfigured()) return { notifications: [], error: notConfigured() }
  const { data, error } = await api.get<{ notifications: AppNotification[] }>('/api/notifications')
  if (error) return { notifications: [], error: new Error(error.message) }
  return { notifications: data?.notifications ?? [], error: null }
}

/** Marque toutes les notifications comme lues. */
export async function markNotificationsRead(): Promise<{ error: Error | null }> {
  if (!isCustomApiConfigured()) return { error: notConfigured() }
  const { error } = await api.post('/api/notifications/read')
  if (error) return { error: new Error(error.message) }
  return { error: null }
}
