import { useState } from 'preact/hooks'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { setProfile } from '@/store/slices/profileSlice'
import { saveProfile } from '@/services/profileService'
import type { InvestorProfile } from '@/store/slices/profileSlice'

const TOTAL_STEPS = 5

type PartialProfile = Partial<InvestorProfile>

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

const STEP_FIELDS: Record<number, keyof PartialProfile> = {
  1: 'risk_tolerance',
  2: 'investment_horizon',
  3: 'investment_goal',
  4: 'monthly_investment',
  5: 'knowledge_level',
}

function OptionList<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string; description: string }[]
  selected: T | undefined
  onSelect: (value: T) => void
}) {
  const selectClass = (isSelected: boolean) =>
    `w-full text-left min-h-[44px] px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
      isSelected
        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-neutral-800 dark:text-neutral-100'
        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600'
    }`

  return (
    <div className="space-y-3">
      {options.map(opt => (
        <button
          key={String(opt.value)}
          type="button"
          className={selectClass(selected === opt.value)}
          onClick={() => onSelect(opt.value)}
        >
          <span className="font-medium text-[13px]">{opt.label}</span>
          <span className="block text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">{opt.description}</span>
        </button>
      ))}
    </div>
  )
}

export function ProfileQuestionnairePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<PartialProfile>({ esg_preference: false })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isStepValid = () => formData[STEP_FIELDS[step]] !== undefined

  const handleNext = () => {
    if (!isStepValid()) {
      setError('Veuillez sélectionner une option avant de continuer.')
      return
    }
    setError(null)
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    if (!isStepValid()) {
      setError('Veuillez compléter cette étape.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const { profile: saved, error: saveError } = await saveProfile(formData as InvestorProfile)
      if (saveError || !saved) {
        setError(saveError?.message ?? 'Erreur lors de la sauvegarde du profil.')
        return
      }
      dispatch(setProfile(saved))
      navigate('/etf')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto pt-2 pb-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight">
            Votre profil investisseur
          </h1>
          <span className="text-[12px] text-neutral-400 tabular-nums">{step} / {TOTAL_STEPS}</span>
        </div>
        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        {step === 1 && (
          <>
            <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-4">
              Quelle est votre tolérance au risque ?
            </p>
            <OptionList
              options={RISK_OPTIONS}
              selected={formData.risk_tolerance}
              onSelect={v => setFormData(d => ({ ...d, risk_tolerance: v }))}
            />
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-4">
              Quel est votre horizon d'investissement ?
            </p>
            <OptionList
              options={HORIZON_OPTIONS}
              selected={formData.investment_horizon}
              onSelect={v => setFormData(d => ({ ...d, investment_horizon: v }))}
            />
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-4">
              Quel est votre objectif principal ?
            </p>
            <OptionList
              options={GOAL_OPTIONS}
              selected={formData.investment_goal}
              onSelect={v => setFormData(d => ({ ...d, investment_goal: v }))}
            />
          </>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
              Quel montant mensuel envisagez-vous d'investir ?
            </p>
            <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
              Laissez à 0 si vous ne savez pas encore. Cela aide à personnaliser vos recommandations.
            </p>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="50"
                value={formData.monthly_investment ?? ''}
                onChange={(e) => setFormData(d => ({ ...d, monthly_investment: Number((e.target as HTMLInputElement).value) }))}
                className="w-full px-3.5 py-2.5 pr-10 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400/60 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400">€ / mois</span>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300 mb-4">
              Quel est votre niveau de connaissance en investissement ?
            </p>
            <OptionList
              options={LEVEL_OPTIONS}
              selected={formData.knowledge_level}
              onSelect={v => setFormData(d => ({ ...d, knowledge_level: v }))}
            />
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.esg_preference ?? false}
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
          </div>
        )}

        {error && (
          <Alert variant="error" className="mt-4">
            {error}
          </Alert>
        )}
      </Card>

      <div className="flex gap-2 mt-4">
        {step > 1 && (
          <Button variant="secondary" onClick={handleBack} disabled={loading}>
            Précédent
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button variant="primary" onClick={handleNext} className="ml-auto">
            Suivant
          </Button>
        ) : (
          <Button variant="primary" onClick={handleSubmit} disabled={loading} aria-busy={loading} className="ml-auto">
            {loading ? <Spinner size="sm" /> : 'Terminer'}
          </Button>
        )}
      </div>
    </div>
  )
}
