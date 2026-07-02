import { useState, useEffect } from 'preact/hooks'
import { Card } from '@/components/ui/Card'
import { MonteCarloChart } from '@/components/ui/MonteCarloChart'
import { MethodTag } from '@/components/ui/MethodTag'
import { getMonteCarlo } from '@/services/montecarloService'
import type { MonteCarloResult } from '@/types/montecarlo'

const HORIZONS = [
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: '1 an', days: 365 },
]

function fmtEur(v: number) {
  return v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
}

/** Carte de projection Monte Carlo du portefeuille (cône de percentiles + VaR 95%). */
export function MonteCarloCard() {
  const [days, setDays] = useState(90)
  const [result, setResult] = useState<MonteCarloResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getMonteCarlo(days, 1000).then(({ data, error }) => {
      if (cancelled) return
      if (error) setError(error.message)
      setResult(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [days])

  const final = result?.steps[result.steps.length - 1]

  return (
    <Card title="Projection Monte Carlo" className="mb-5 overflow-hidden">
      <div className="flex flex-wrap gap-1.5 mb-4">
        {HORIZONS.map((h) => (
          <button
            key={h.days}
            type="button"
            onClick={() => setDays(h.days)}
            class={`px-3 py-1 rounded-lg text-[12px] font-medium transition-colors ${
              days === h.days
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-[200px] animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800/50" aria-hidden />
      ) : error ? (
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 py-8 text-center">
          {error === 'Portefeuille vide'
            ? 'Ajoutez des actifs pour voir une projection.'
            : `Projection indisponible : ${error}`}
        </p>
      ) : result && final ? (
        <>
          <MonteCarloChart steps={result.steps} initialValue={result.initialValue} />
          <MethodTag label="Simulation Monte Carlo — mouvement brownien géométrique (GBM, numpy)" />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Médiane</p>
              <p className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums">
                {fmtEur(final.p50)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Pire cas (5%)</p>
              <p className="text-[15px] font-semibold text-red-600 dark:text-red-400 tabular-nums">
                {fmtEur(final.p5)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">VaR 95%</p>
              <p className="text-[15px] font-semibold text-red-600 dark:text-red-400 tabular-nums">
                −{fmtEur(result.var95)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500 text-center">
            {result.simulations.toLocaleString('fr-FR')} simulations · cône = intervalles 5–95 % et 25–75 %
          </p>
        </>
      ) : null}
    </Card>
  )
}
