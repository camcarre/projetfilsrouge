import { useState, useEffect } from 'preact/hooks'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/contexts/ThemeContext'
import type { RootState } from '@/store'

const STORAGE_KEYS = {
  email: 'finance-pwa-notif-email',
  inApp: 'finance-pwa-notif-inapp',
  variationThreshold: 'finance-pwa-notif-variation-threshold',
  dividends: 'finance-pwa-notif-dividends',
} as const

function useNotificationPrefs() {
  const [email, setEmail] = useState(false)
  const [inApp, setInApp] = useState(true)
  const [variationThreshold, setVariationThreshold] = useState('')
  const [dividends, setDividends] = useState(false)

  useEffect(() => {
    try {
      setEmail(localStorage.getItem(STORAGE_KEYS.email) === '1')
      setInApp(localStorage.getItem(STORAGE_KEYS.inApp) !== '0')
      setVariationThreshold(localStorage.getItem(STORAGE_KEYS.variationThreshold) ?? '')
      setDividends(localStorage.getItem(STORAGE_KEYS.dividends) === '1')
    } catch {
      // ignore
    }
  }, [])

  const update = (key: keyof typeof STORAGE_KEYS, value: boolean | string) => {
    try {
      const v = typeof value === 'boolean' ? (value ? '1' : '0') : value
      localStorage.setItem(STORAGE_KEYS[key], v)
      if (key === 'email') setEmail(value as boolean)
      else if (key === 'inApp') setInApp(value as boolean)
      else if (key === 'variationThreshold') setVariationThreshold(value as string)
      else if (key === 'dividends') setDividends(value as boolean)
    } catch {
      // ignore
    }
  }

  return { email, inApp, variationThreshold, dividends, update }
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span className="relative inline-flex flex-shrink-0 w-10 h-6 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
          className="sr-only peer"
        />
        <span
          className={`block w-full h-full rounded-full transition-colors ${
            checked ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'
          }`}
          aria-hidden
        />
        <span
          className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
          aria-hidden
        />
      </span>
      <span>
        <span className="text-[14px] font-medium text-neutral-800 dark:text-neutral-100">{label}</span>
        {description && (
          <p id={`${label.replace(/\s/g, '-')}-desc`} className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            {description}
          </p>
        )}
      </span>
    </label>
  )
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { email, inApp, variationThreshold, dividends, update } = useNotificationPrefs()
  const navigate = useNavigate()
  const profile = useSelector((state: RootState) => state.profile.profile)

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">
        Paramètres
      </h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Apparence et préférences.
      </p>

      <Card title="Apparence" className="mb-5">
        <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-3">
          Thème d&apos;affichage : clair ou sombre.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${theme === 'light' ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
          >
            Clair
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${theme === 'dark' ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
          >
            Sombre
          </button>
        </div>
      </Card>

      {profile && (
        <Card title="Profil investisseur" className="mb-5">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-4">
            Modifiez vos préférences pour affiner les recommandations ETF.
          </p>
          <div className="flex flex-wrap gap-2 text-[12px] text-neutral-500 dark:text-neutral-400 mb-4">
            <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">Risque {profile.risk_tolerance}/5</span>
            <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">
              {profile.investment_horizon === 'short' ? 'Court terme' : profile.investment_horizon === 'medium' ? 'Moyen terme' : 'Long terme'}
            </span>
            <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800">
              {profile.investment_goal === 'growth' ? 'Croissance' : profile.investment_goal === 'income' ? 'Revenus' : 'Préservation'}
            </span>
            {profile.esg_preference && (
              <span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">ESG</span>
            )}
          </div>
          <Button variant="secondary" onClick={() => navigate('/profile/edit')}>
            Modifier mon profil
          </Button>
        </Card>
      )}

      <Card title="Notifications" className="mb-5">
        <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-4">
          Alertes par email ou in-app : seuils de prix, variation, dividendes. Les envois réels seront activés avec le backend.
        </p>
        <div className="space-y-4">
          <Toggle
            checked={email}
            onChange={(v) => update('email', v)}
            label="Notifications par email"
            description="Recevoir les alertes par email (quand le service sera connecté)."
          />
          <Toggle
            checked={inApp}
            onChange={(v) => update('inApp', v)}
            label="Notifications in-app"
            description="Afficher les alertes dans l'application."
          />
          <div>
            <label htmlFor="variation-threshold" className="block text-[14px] font-medium text-neutral-800 dark:text-neutral-100 mb-1">
              Seuil de variation (%)
            </label>
            <input
              id="variation-threshold"
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="Ex. 5"
              value={variationThreshold}
              onInput={(e) => update('variationThreshold', (e.target as HTMLInputElement).value)}
              className="w-full max-w-[120px] px-3 py-2 text-[13px] border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">
              Alerter si un actif varie de plus de X % sur la période.
            </p>
          </div>
          <Toggle
            checked={dividends}
            onChange={(v) => update('dividends', v)}
            label="Alertes dividendes"
            description="Être notifié des prochains versements de dividendes."
          />
        </div>
      </Card>

    </div>
  )
}
