import { useState, useEffect } from 'preact/hooks'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { setProfile } from '@/store/slices/profileSlice'
import { saveProfile } from '@/services/profileService'
import type { RootState } from '@/store'
import type { InvestorProfile } from '@/store/slices/profileSlice'

const RISK_OPTIONS = [
  { value: 1, label: 'Très prudent', description: 'Je privilégie la sécurité avant tout' },
  { value: 2, label: 'Prudent', description: 'Quelques risques acceptables pour de légers gains' },
  { value: 3, label: 'Équilibré', description: 'Un bon équilibre entre risque et rendement' },
  { value: 4, label: 'Dynamique', description: "Je vise des gains élevés, j'accepte la volatilité" },
  { value: 5, label: 'Très dynamique', description: 'Performance maximale, risque maximum accepté' },
]

const HORIZON_OPTIONS = [
  { value: 'short' as const, label: 'Court terme', description: 'Moins de 3 ans' },
  { value: 'medium' as const, label: 'Moyen terme', description: '3 à 8 ans' },
  { value: 'long' as const, label: 'Long terme', description: 'Plus de 8 ans' },
]

const GOAL_OPTIONS = [
  { value: 'growth' as const, label: 'Croissance', description: 'Faire fructifier mon capital' },
  { value: 'income' as const, label: 'Revenus', description: 'Générer des revenus réguliers' },
  { value: 'preservation' as const, label: 'Préservation', description: "Protéger mon capital de l'inflation" },
]

const LEVEL_OPTIONS = [
  { value: 'beginner' as const, label: 'Débutant', description: "Je découvre l'investissement" },
  { value: 'intermediate' as const, label: 'Intermédiaire', description: 'Je connais les bases' },
  { value: 'advanced' as const, label: 'Avancé', description: "J'investis régulièrement depuis plusieurs années" },
]

function OptionList<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string; description: string }[]
  selected: T | undefined
  onSelect: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
            selected === opt.value
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-neutral-800 dark:text-neutral-100'
              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
          }`}
        >
          <span className="font-medium text-[13px]">{opt.label}</span>
          <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">{opt.description}</span>
        </button>
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-3">{children}</p>
  )
}

export function ProfileEditPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const currentProfile = useSelector((state: RootState) => state.profile.profile)

  const [formData, setFormData] = useState<InvestorProfile>(() => currentProfile ?? {
    risk_tolerance: 3,
    investment_horizon: 'medium',
    investment_goal: 'growth',
    monthly_investment: 0,
    esg_preference: false,
    knowledge_level: 'beginner',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!currentProfile) {
      navigate('/profile/questionnaire', { replace: true })
    }
  }, [currentProfile, navigate])

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const { profile, error: saveError } = await saveProfile(formData)
      if (saveError || !profile) {
        setError(saveError?.message ?? 'Erreur lors de la sauvegarde.')
        return
      }
      dispatch(setProfile(profile))
      setSaved(true)
      setTimeout(() => navigate('/'), 1000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto pt-2 pb-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">
              Modifier mon profil
            </h1>
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-1">
              Vos réponses personnalisent les recommandations ETF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <SectionLabel>Tolérance au risque</SectionLabel>
          <OptionList
            options={RISK_OPTIONS}
            selected={formData.risk_tolerance}
            onSelect={v => setFormData(d => ({ ...d, risk_tolerance: v }))}
          />
        </Card>

        <Card>
          <SectionLabel>Horizon d'investissement</SectionLabel>
          <OptionList
            options={HORIZON_OPTIONS}
            selected={formData.investment_horizon}
            onSelect={v => setFormData(d => ({ ...d, investment_horizon: v }))}
          />
        </Card>

        <Card>
          <SectionLabel>Objectif principal</SectionLabel>
          <OptionList
            options={GOAL_OPTIONS}
            selected={formData.investment_goal}
            onSelect={v => setFormData(d => ({ ...d, investment_goal: v }))}
          />
        </Card>

        <Card>
          <SectionLabel>Montant mensuel envisagé</SectionLabel>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="50"
              value={formData.monthly_investment}
              onChange={(e) => setFormData(d => ({ ...d, monthly_investment: Number((e.target as HTMLInputElement).value) }))}
              className="w-full px-3.5 py-2.5 pr-10 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400/60 transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400">€ / mois</span>
          </div>
        </Card>

        <Card>
          <SectionLabel>Niveau de connaissance</SectionLabel>
          <OptionList
            options={LEVEL_OPTIONS}
            selected={formData.knowledge_level}
            onSelect={v => setFormData(d => ({ ...d, knowledge_level: v }))}
          />
          <div className="pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.esg_preference}
                onChange={(e) => setFormData(d => ({ ...d, esg_preference: (e.target as HTMLInputElement).checked }))}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">Préférence ESG</span>
                <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Favoriser les ETFs respectueux des critères environnementaux, sociaux et de gouvernance
                </span>
              </div>
            </label>
          </div>
        </Card>

        {error && <Alert variant="error">{error}</Alert>}
        {saved && <Alert variant="success">Profil mis à jour. Redirection...</Alert>}

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading || saved}
          aria-busy={loading}
          className="w-full"
        >
          {loading ? <Spinner size="sm" /> : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  )
}
