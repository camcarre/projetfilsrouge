import { useState, useEffect } from 'preact/hooks'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { listAlertRules, createAlertRule, deleteAlertRule } from '@/services/alertsService'
import type { AlertRule, AlertScope, AlertMetric, AlertDirection } from '@/types/alerts'

const METRIC_LABEL: Record<AlertMetric, string> = {
  day_change: 'variation du jour',
  vs_pru: 'plus/moins-value',
}
const DIR_LABEL: Record<AlertDirection, string> = { below: 'sous', above: 'au-dessus de' }

function describe(r: AlertRule): string {
  const cible = r.scope === 'portfolio' ? 'Le portefeuille' : `${r.symbol}`
  return `${cible} : ${METRIC_LABEL[r.metric]} ${DIR_LABEL[r.direction]} ${r.threshold} %`
}

/** Gestion des règles d'alerte (CRUD sur /api/alerts). */
export function AlertRulesCard() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [scope, setScope] = useState<AlertScope>('asset')
  const [symbol, setSymbol] = useState('')
  const [metric, setMetric] = useState<AlertMetric>('day_change')
  const [direction, setDirection] = useState<AlertDirection>('below')
  const [threshold, setThreshold] = useState('')

  const load = () => {
    setLoading(true)
    listAlertRules().then(({ rules, error }) => {
      if (error) setError(error.message)
      else setRules(rules)
      setLoading(false)
    })
  }

  useEffect(load, [])

  const submit = async (e: Event) => {
    e.preventDefault()
    const t = parseFloat(threshold)
    if (Number.isNaN(t)) {
      setError('Seuil invalide')
      return
    }
    if (scope === 'asset' && !symbol.trim()) {
      setError('Symbole requis pour une alerte sur actif')
      return
    }
    setSaving(true)
    setError(null)
    const { error } = await createAlertRule({
      scope,
      symbol: scope === 'asset' ? symbol.trim().toUpperCase() : null,
      metric,
      direction,
      threshold: t,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setSymbol('')
    setThreshold('')
    load()
  }

  const remove = async (id: number) => {
    await deleteAlertRule(id)
    setRules((rs) => rs.filter((r) => r.id !== id))
  }

  const inputCls =
    'px-3 py-2 text-[13px] border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500'

  return (
    <Card title="Règles d'alerte" className="mb-5">
      <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-4">
        Reçois une notification in-app quand un actif ou ton portefeuille franchit un seuil. Vérifié à
        chaque rafraîchissement du portefeuille.
      </p>

      {loading ? (
        <div className="h-16 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800/50 mb-4" aria-hidden />
      ) : rules.length === 0 ? (
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4">Aucune règle pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2 mb-4">
          {rules.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-[13px]"
            >
              <span className="text-neutral-700 dark:text-neutral-300">{describe(r)}</span>
              <button
                type="button"
                onClick={() => remove(r.id)}
                class="text-[12px] text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} class="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
        <label class="flex flex-col gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
          Cible
          <select value={scope} onChange={(e) => setScope((e.target as HTMLSelectElement).value as AlertScope)} class={inputCls}>
            <option value="asset">Un actif</option>
            <option value="portfolio">Portefeuille</option>
          </select>
        </label>

        {scope === 'asset' && (
          <label class="flex flex-col gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
            Symbole
            <input
              value={symbol}
              onInput={(e) => setSymbol((e.target as HTMLInputElement).value)}
              placeholder="AAPL"
              class={inputCls}
            />
          </label>
        )}

        <label class="flex flex-col gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
          Métrique
          <select value={metric} onChange={(e) => setMetric((e.target as HTMLSelectElement).value as AlertMetric)} class={inputCls}>
            <option value="day_change">Variation du jour</option>
            <option value="vs_pru">Plus/moins-value</option>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
          Sens
          <select value={direction} onChange={(e) => setDirection((e.target as HTMLSelectElement).value as AlertDirection)} class={inputCls}>
            <option value="below">Sous</option>
            <option value="above">Au-dessus</option>
          </select>
        </label>

        <label class="flex flex-col gap-1 text-[12px] text-neutral-500 dark:text-neutral-400">
          Seuil (%)
          <input
            type="number"
            step="0.5"
            value={threshold}
            onInput={(e) => setThreshold((e.target as HTMLInputElement).value)}
            placeholder="-5"
            class={inputCls}
          />
        </label>

        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Ajout…' : 'Ajouter'}
        </Button>
      </form>

      {error && <p class="text-[12px] text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </Card>
  )
}
