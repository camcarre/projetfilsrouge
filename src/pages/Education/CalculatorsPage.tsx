import { useState } from 'preact/hooks'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/format'

export function CalculatorsPage() {
  const [calc, setCalc] = useState<'compound' | 'dca'>('compound')
  const [capital, setCapital] = useState(10000)
  const [rate, setRate] = useState(5)
  const [years, setYears] = useState(10)
  const [monthly, setMonthly] = useState(200)
  const [yearsDca, setYearsDca] = useState(10)
  const [rateDca, setRateDca] = useState(5)

  const compoundResult = capital * Math.pow(1 + rate / 100, years)
  const dcaMonths = yearsDca * 12
  const dcaResult = Array.from({ length: dcaMonths }, (_, i) => monthly * Math.pow(1 + rateDca / 100 / 12, dcaMonths - i - 1)).reduce((a, b) => a + b, 0)

  const inputClass = 'w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Calculatrices</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Intérêts composés et simulation DCA.
      </p>

      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setCalc('compound')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${calc === 'compound' ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
        >
          Intérêts composés
        </button>
        <button
          type="button"
          onClick={() => setCalc('dca')}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${calc === 'dca' ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}
        >
          DCA mensuel
        </button>
      </div>

      {calc === 'compound' && (
        <Card title="Intérêts composés">
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4">
            Capital initial, taux annuel et durée pour obtenir la valeur future.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Capital initial (€)</label>
              <input type="number" min={0} step={100} value={capital} onChange={(e) => setCapital(Number((e.target as HTMLInputElement).value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Taux annuel (%)</label>
              <input type="number" min={0} step={0.5} value={rate} onChange={(e) => setRate(Number((e.target as HTMLInputElement).value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Années</label>
              <input type="number" min={1} max={50} value={years} onChange={(e) => setYears(Number((e.target as HTMLInputElement).value) || 1)} className={inputClass} />
            </div>
          </div>
          <p className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-100">
            Valeur future : {formatCurrency(compoundResult)}
          </p>
        </Card>
      )}

      {calc === 'dca' && (
        <Card title="Simulation DCA (versement mensuel)">
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4">
            Versement mensuel fixe, taux annuel et durée pour estimer le capital accumulé.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Versement mensuel (€)</label>
              <input type="number" min={0} step={50} value={monthly} onChange={(e) => setMonthly(Number((e.target as HTMLInputElement).value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Taux annuel (%)</label>
              <input type="number" min={0} step={0.5} value={rateDca} onChange={(e) => setRateDca(Number((e.target as HTMLInputElement).value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Années</label>
              <input type="number" min={1} max={40} value={yearsDca} onChange={(e) => setYearsDca(Number((e.target as HTMLInputElement).value) || 1)} className={inputClass} />
            </div>
          </div>
          <p className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-100">
            Capital estimé : {formatCurrency(dcaResult)} (apports totaux : {formatCurrency(monthly * dcaMonths)})
          </p>
        </Card>
      )}

      <div className="mt-4">
        <Link to="/education"><Button variant="secondary">Retour aux modules</Button></Link>
      </div>
    </div>
  )
}
