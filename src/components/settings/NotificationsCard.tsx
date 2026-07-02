import { useState, useEffect } from 'preact/hooks'
import { Card } from '@/components/ui/Card'
import { listNotifications, markNotificationsRead } from '@/services/alertsService'
import type { AppNotification } from '@/types/alerts'

/** Liste des notifications in-app déclenchées par les alertes. */
export function NotificationsCard() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    listNotifications().then(({ notifications }) => {
      setItems(notifications)
      setLoading(false)
    })
  }

  useEffect(load, [])

  const markAllRead = async () => {
    await markNotificationsRead()
    setItems((xs) => xs.map((x) => ({ ...x, read: 1 })))
  }

  const unread = items.filter((i) => !i.read).length

  return (
    <Card title="Notifications récentes" className="mb-5">
      <div class="flex items-center justify-between mb-3">
        <p class="text-[13px] text-neutral-600 dark:text-neutral-400">
          {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est lu'}
        </p>
        {unread > 0 && (
          <button type="button" onClick={markAllRead} class="text-[12px] text-emerald-600 dark:text-emerald-400 hover:underline">
            Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div class="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800/50" aria-hidden />
      ) : items.length === 0 ? (
        <p class="text-[13px] text-neutral-500 dark:text-neutral-400">Aucune notification.</p>
      ) : (
        <ul class="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              class={`flex items-start gap-2 px-3 py-2 rounded-lg text-[13px] ${
                n.read
                  ? 'bg-neutral-50 dark:bg-neutral-800/30 text-neutral-500 dark:text-neutral-400'
                  : 'bg-emerald-50 dark:bg-emerald-500/10 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              {!n.read && <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden />}
              <div>
                <p>{n.message}</p>
                <p class="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  {new Date(n.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
