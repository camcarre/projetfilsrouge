import { useState, useEffect } from 'preact/hooks'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { CombinedChart } from '@/components/ui/CombinedChart'
import { CorrelationHeatmap } from '@/components/ui/CorrelationHeatmap'
import { getStockPrediction } from '@/services/predictionService'
import { getIndicators, getRiskMetrics, getCorrelationMatrix } from '@/services/analyticsService'
import type { IndicatorsResponse, RiskMetrics, CorrelationMatrix, Backtest } from '@/types/analytics'

/** Extrait une valeur numérique ou une série du retour API pour l'affichage */
function parsePrediction(prediction: unknown): { value?: number; series?: number[]; history?: number[]; raw: unknown } {
  const raw = prediction
  let value: number | undefined
  let series: number[] | undefined
  let history: number[] | undefined

  if (typeof prediction === 'number' && !Number.isNaN(prediction)) {
    value = prediction
  } else if (Array.isArray(prediction) && prediction.length > 0) {
    const numbers = prediction.filter((n): n is number => typeof n === 'number')
    if (numbers.length > 0) {
      series = numbers
      value = numbers[numbers.length - 1]
    }
  } else if (prediction && typeof prediction === 'object') {
    const p = prediction as any
    if ('predicted_price' in p && typeof p.predicted_price === 'number') {
      value = p.predicted_price
    }
    if ('forecast' in p && Array.isArray(p.forecast)) {
      series = p.forecast as number[]
      if (value === undefined && series && series.length > 0) value = series[series.length - 1]
    }
    if ('history' in p && Array.isArray(p.history)) {
      history = p.history
    }
  }
  return { value, series, history, raw }
}

/** Données factices : évolution actuelle (réel) + prédiction pour l'aperçu */
const MOCK_HISTORICAL = [182, 183, 181, 184, 185, 186, 185, 187, 188, 189, 190, 189, 191, 192]
const MOCK_PREDICTION_SERIES = [192, 193.5, 195, 196.2, 197, 198.5]
const MOCK_PREVIEW = {
  symbol: 'AAPL',
  historical: MOCK_HISTORICAL,
  prediction: {
    predicted_price: 198.5,
    forecast: MOCK_PREDICTION_SERIES,
    confidence_interval: [186, 211],
  },
}

const PREDICTION_HISTORY_KEY = 'analysis_prediction_history'
const MAX_HISTORY = 50
type PredictionHistoryEntry = { symbol: string; date: string; value: number }
function loadPredictionHistory(): PredictionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(PREDICTION_HISTORY_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as PredictionHistoryEntry[]
    return Array.isArray(arr) ? arr.slice(-MAX_HISTORY) : []
  } catch {
    return []
  }
}
function savePredictionHistory(history: PredictionHistoryEntry[]) {
  localStorage.setItem(PREDICTION_HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)))
}

const AVAILABLE_SYMBOLS = [
  { symbol: 'CW8.PA', name: 'Amundi MSCI World (CW8)' },
  { symbol: 'EWLD.PA', name: 'Lyxor PEA Monde (EWLD)' },
  { symbol: 'SPY', name: 'SPDR S&P 500 (SPY)' },
  { symbol: 'QQQ', name: 'Invesco QQQ (Nasdaq-100)' },
  { symbol: 'AAPL', name: 'Apple Inc. (AAPL)' },
  { symbol: 'MSFT', name: 'Microsoft Corp. (MSFT)' },
  { symbol: 'TSLA', name: 'Tesla Inc. (TSLA)' },
  { symbol: 'NVDA', name: 'NVIDIA Corp. (NVDA)' },
  { symbol: 'BTC-USD', name: 'Bitcoin (BTC)' },
  { symbol: 'ETH-USD', name: 'Ethereum (ETH)' },
  { symbol: 'EURUSD=X', name: 'EUR/USD' },
]

/** Filtre l'historique selon la période sélectionnée */
function filterByPeriod(data: number[], period: '1M' | '6M' | '1Y' | 'MAX'): number[] {
  if (period === '1M') return data.slice(-22)
  if (period === '6M') return data.slice(-130)
  return data
}

export function AnalysisPage() {
  const [symbol, setSymbol] = useState(AVAILABLE_SYMBOLS[0].symbol)
  const [result, setResult] = useState<{ symbol: string; prediction: unknown } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [chartHoverValue, setChartHoverValue] = useState<number | null>(null)
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryEntry[]>(loadPredictionHistory)

  const [indicators, setIndicators] = useState<IndicatorsResponse | null>(null)
  const [indicatorsError, setIndicatorsError] = useState<string | null>(null)
  const [indicatorsLoading, setIndicatorsLoading] = useState(false)

  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [riskError, setRiskError] = useState<string | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)

  const [correlation, setCorrelation] = useState<CorrelationMatrix | null>(null)
  const [correlationError, setCorrelationError] = useState<string | null>(null)
  const [correlationInsufficientAssets, setCorrelationInsufficientAssets] = useState(false)
  const [correlationLoading, setCorrelationLoading] = useState(true)

  useEffect(() => {
    getCorrelationMatrix().then(({ data, error, insufficientAssets }) => {
      setCorrelation(data)
      setCorrelationError(error && !insufficientAssets ? error.message : null)
      setCorrelationInsufficientAssets(insufficientAssets)
      setCorrelationLoading(false)
    })
  }, [])

  const handlePredict = async (overrideSymbol?: string) => {
    const sym = (overrideSymbol ?? symbol).trim()
    if (!sym) return
    if (!overrideSymbol) setSymbol(sym)
    setError(null)
    setResult(null)
    setShowPreview(false)
    setChartHoverValue(null)
    setIndicators(null)
    setIndicatorsError(null)
    setRiskMetrics(null)
    setRiskError(null)
    setLoading(true)
    setIndicatorsLoading(true)
    setRiskLoading(true)

    const [predResult, indResult, riskResult] = await Promise.all([
      getStockPrediction(sym),
      getIndicators(sym),
      getRiskMetrics(sym),
    ])

    setLoading(false)
    setIndicatorsLoading(false)
    setRiskLoading(false)

    if (predResult.error) {
      let msg = predResult.error.message
      if (msg.includes('401') || msg.includes('Non authentifié'))
        msg = 'Session expirée ou invalide (backend redémarré ?). Reconnecte-toi puis réessaie.'
      else if (msg.includes('503') || msg.includes('HF_TOKEN') || msg.includes('non configurée'))
        msg = 'Prédiction non disponible : ajoute HF_TOKEN (ou HUGGINGFACE_TOKEN) dans le fichier .env du backend, puis redémarre le serveur.'
      setError(msg)
    } else if (predResult.data) {
      setResult(predResult.data)
      const parsed = parsePrediction(predResult.data.prediction)
      if (typeof parsed.value === 'number' && !Number.isNaN(parsed.value)) {
        const entry: PredictionHistoryEntry = { symbol: predResult.data.symbol, date: new Date().toISOString(), value: parsed.value }
        setPredictionHistory((prev) => {
          const next = [...prev, entry].slice(-MAX_HISTORY)
          savePredictionHistory(next)
          return next
        })
      }
    }

    if (indResult.error) setIndicatorsError(indResult.error.message)
    else setIndicators(indResult.data)

    if (riskResult.error) setRiskError(riskResult.error.message)
    else setRiskMetrics(riskResult.data)
  }

  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '6M' | '1Y' | 'MAX'>('1Y')
  const [chartHovered, setChartHovered] = useState(false)
  const display = showPreview ? MOCK_PREVIEW : result
  const parsed = display ? parsePrediction(display.prediction) : null
  const rawModel = (parsed?.raw as any)?.model
  const historical = showPreview ? MOCK_HISTORICAL : parsed?.history ?? []
  const predictionSeries = parsed?.series ?? (showPreview ? MOCK_PREDICTION_SERIES : [])
  const filteredHistorical = filterByPeriod(historical, selectedPeriod)
  const filteredPrediction = selectedPeriod === '1M'
    ? predictionSeries.slice(0, 5)
    : selectedPeriod === '6M'
    ? predictionSeries.slice(0, Math.ceil(predictionSeries.length * 0.5))
    : predictionSeries
  const hasCombinedChart = filteredHistorical.length >= 2 && filteredPrediction.length >= 2
  const lastVal = parsed?.value ?? (predictionSeries.length > 0 ? predictionSeries[predictionSeries.length - 1] : 0)
  const firstVal = historical.length > 0 ? historical[0] : lastVal
  const variationPct = firstVal ? ((lastVal - firstVal) / firstVal) * 100 : 0

  // Indicateurs — dernières valeurs non-null
  const lastRsi = indicators ? [...indicators.rsi].reverse().find((v) => v !== null) ?? null : null
  const lastMacdLine = indicators ? [...indicators.macd_line].reverse().find((v) => v !== null) ?? null : null
  const lastMacdSignal = indicators ? [...indicators.macd_signal].reverse().find((v) => v !== null) ?? null : null
  const lastMacdHist = indicators ? [...indicators.macd_histogram].reverse().find((v) => v !== null) ?? null : null
  const lastBbUpper = indicators ? [...indicators.bollinger_upper].reverse().find((v) => v !== null) ?? null : null
  const lastBbMiddle = indicators ? [...indicators.bollinger_middle].reverse().find((v) => v !== null) ?? null : null
  const lastBbLower = indicators ? [...indicators.bollinger_lower].reverse().find((v) => v !== null) ?? null : null

  function rsiBadge(rsi: number | null) {
    if (rsi === null) return null
    if (rsi < 30) return { label: 'Survente', cls: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-700/40' }
    if (rsi > 70) return { label: 'Surachat', cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200/60 dark:border-red-700/40' }
    return { label: 'Neutre', cls: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700' }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-6">
        Analyse et visualisation
      </h1>

      <Card title="Prédiction de cours" className="mb-5">
        <p className="text-[13px] text-neutral-500 dark:text-neutral-500 mb-3">
          Sélectionne un actif dans la liste et lance la prédiction via Intelligence Artificielle (Hugging Face).
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="symbol-select" className="sr-only">
            Sélectionner un actif
          </label>
          <div className="relative">
            <select
              id="symbol-select"
              value={symbol}
              onChange={(e) => { setSymbol((e.target as HTMLSelectElement).value); setShowPreview(false) }}
              className="w-full sm:w-64 px-3.5 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400/60 focus:border-neutral-400 dark:focus:ring-neutral-500/60 transition-all duration-200 ease-out hover:border-neutral-300 dark:hover:border-neutral-600 appearance-none cursor-pointer pr-8"
              aria-invalid={!!error}
              aria-describedby={error ? 'prediction-error' : undefined}
            >
              {AVAILABLE_SYMBOLS.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500 dark:text-neutral-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <Button variant="primary" onClick={() => handlePredict()} disabled={loading} aria-busy={loading}>
            {loading ? <Spinner size="sm" /> : 'Prédire'}
          </Button>
          {!result && (
            <Button variant="secondary" onClick={() => { setError(null); setChartHoverValue(null); setShowPreview((p) => !p) }}>
              {showPreview ? "Masquer l'aperçu" : "Voir l'aperçu"}
            </Button>
          )}
        </div>
        {error && (
          <Alert variant="error" className="mt-2" id="prediction-error">
            {error}
          </Alert>
        )}

        {display && (
          <div className="mt-6 border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">{display.symbol}</span>
                {showPreview && (
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-700/40">
                    Aperçu
                  </span>
                )}
                {!showPreview && rawModel === 'linear-regression' && (
                  <span title="Pas de clé HF_API_TOKEN — régression linéaire locale utilisée" className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                    Régression locale
                  </span>
                )}
                {!showPreview && rawModel && rawModel !== 'linear-regression' && (
                  <span title={rawModel} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-700/40">
                    IA · {rawModel.split('/').pop()}
                  </span>
                )}
              </div>
            </div>
            {/* Métriques style fiche instrument */}
            {parsed?.value != null && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <div
                  className={`analysis-metric-card rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30 pl-4 pr-3 py-3 border-l-4 transition-all duration-300 ease-out hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 hover:-translate-y-px ${
                    variationPct >= 0 ? 'border-l-emerald-500 dark:border-l-emerald-400' : 'border-l-red-500 dark:border-l-red-400'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Variation (période)</p>
                  <p className={`text-base font-semibold tabular-nums ${variationPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {variationPct >= 0 ? '+' : ''}{variationPct.toFixed(2)}%
                  </p>
                </div>
                <div className="analysis-metric-card rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30 border-l-4 border-l-slate-400 dark:border-l-slate-500 pl-4 pr-3 py-3 transition-all duration-300 ease-out hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 hover:-translate-y-px">
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Valeur prédite</p>
                  <p className="text-base font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">{(chartHoverValue ?? parsed.value).toFixed(2)} USD</p>
                </div>
              </div>
            )}
            {hasCombinedChart && (
              <div className="mb-4">
                {/* Sélecteur de période style fiche */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(['1M', '6M', '1Y', 'MAX'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPeriod(p)}
                      className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-300 ease-out ${
                        selectedPeriod === p
                          ? 'bg-neutral-800 text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-900'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:scale-[1.03] active:scale-[0.98] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div
                  className={`rounded-2xl border bg-gradient-to-b from-neutral-50/80 to-white dark:from-neutral-900/60 dark:to-neutral-900/80 p-5 overflow-x-auto transition-all duration-300 ease-out ${
                    chartHovered
                      ? 'border-emerald-300/70 dark:border-emerald-500/40 shadow-md ring-1 ring-emerald-500/10 dark:ring-emerald-400/10'
                      : 'border-neutral-200 dark:border-neutral-700 shadow-sm'
                  }`}
                  onMouseEnter={() => setChartHovered(true)}
                  onMouseLeave={() => setChartHovered(false)}
                >
                  <CombinedChart historical={filteredHistorical} prediction={filteredPrediction} onHover={setChartHoverValue} />
                </div>
                {!showPreview && historical.length > 0 && historical.every((v) => v === historical[0]) && (
                  <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-500">
                    Données historiques limitées ou constantes.
                  </p>
                )}
              </div>
            )}
            {parsed?.raw != null && (showPreview || !parsed.value) && (
              <details className="mt-3">
                <summary className="text-[12px] text-neutral-500 dark:text-neutral-500 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200 rounded px-1 py-0.5 -mx-1">
                  Détails bruts (API)
                </summary>
                <pre className="mt-2 p-3 rounded bg-neutral-100 dark:bg-neutral-800/50 text-[11px] text-neutral-600 dark:text-neutral-400 overflow-x-auto">
                  {JSON.stringify(parsed.raw, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </Card>

      {/* ── Fiabilité du modèle (Backtest) ────────────────────────────────────── */}
      {!showPreview && parsed && (
        <Card title="Fiabilité du modèle (backtest)" className="mb-5">
          {(() => {
            const backtest = (parsed.raw as any)?.backtest as Backtest | undefined | null
            if (!backtest) {
              return (
                <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                  Backtest indisponible (données insuffisantes ou prédiction IA).
                </p>
              )
            }
            return (
              <div className="space-y-3">
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-3">
                  Évaluation out-of-sample : {backtest.train_size} points train, {backtest.test_size} points test (horizon={backtest.horizon}).
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">RMSE</p>
                    <p className="text-lg font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
                      {backtest.rmse.toFixed(4)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">MAE</p>
                    <p className="text-lg font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
                      {backtest.mae.toFixed(4)}
                    </p>
                  </div>
                  <div className={`rounded-xl border px-4 py-3 ${
                    backtest.r2 >= 0.5
                      ? 'border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20'
                      : backtest.r2 >= 0.2
                      ? 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30'
                      : 'border-red-200 dark:border-red-700/40 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">R²</p>
                    <p className={`text-lg font-semibold tabular-nums ${
                      backtest.r2 >= 0.5
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : backtest.r2 >= 0.2
                        ? 'text-neutral-800 dark:text-neutral-100'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {backtest.r2.toFixed(4)}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-3">
                  Modèle : <span className="font-medium">{backtest.model}</span>
                </p>
              </div>
            )
          })()}
        </Card>
      )}

      {/* ── Indicateurs techniques ─────────────────────────────────────────── */}
      <Card title="Indicateurs techniques" className="mb-5">
        {indicatorsLoading && (
          <div className="flex items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400">
            <Spinner size="sm" /> Chargement des indicateurs…
          </div>
        )}
        {indicatorsError && !indicatorsLoading && (
          <Alert variant="error">{indicatorsError}</Alert>
        )}
        {!indicators && !indicatorsLoading && !indicatorsError && (
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
            Lance une analyse ci-dessus pour afficher RSI, MACD et Bandes de Bollinger.
          </p>
        )}
        {indicators && !indicatorsLoading && (
          <div className="space-y-4">
            {/* RSI */}
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider w-12">RSI</span>
              <span className="text-lg font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
                {lastRsi !== null ? lastRsi.toFixed(1) : '—'}
              </span>
              {lastRsi !== null && (() => {
                const badge = rsiBadge(lastRsi)
                return badge ? (
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${badge.cls}`}>
                    {badge.label}
                  </span>
                ) : null
              })()}
            </div>
            {/* MACD */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">MACD</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Ligne', value: lastMacdLine },
                  { label: 'Signal', value: lastMacdSignal },
                  { label: 'Histogramme', value: lastMacdHist },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
                    <p className={`text-sm font-semibold tabular-nums ${
                      value === null ? 'text-neutral-400' :
                      value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {value !== null ? value.toFixed(3) : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* Bollinger */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Bandes de Bollinger</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Supérieure', value: lastBbUpper },
                  { label: 'Médiane', value: lastBbMiddle },
                  { label: 'Inférieure', value: lastBbLower },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
                    <p className="text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">
                      {value !== null ? value.toFixed(2) : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* ── Risque ──────────────────────────────────────────────────────── */}
        <Card title="Risque">
          {riskLoading && (
            <div className="flex items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400">
              <Spinner size="sm" /> Calcul du risque…
            </div>
          )}
          {riskError && !riskLoading && (
            <Alert variant="error">{riskError}</Alert>
          )}
          {!riskMetrics && !riskLoading && !riskError && (
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
              Lance une analyse pour afficher VaR, drawdown et Sharpe.
            </p>
          )}
          {riskMetrics && !riskLoading && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Perte max 1j (95%)',
                  value: riskMetrics.var_95,
                  format: (v: number) => `${v.toFixed(2)}%`,
                  colorCls: riskMetrics.var_95 < -2 ? 'border-l-red-500 dark:border-l-red-400 text-red-600 dark:text-red-400' : 'border-l-neutral-400 text-neutral-800 dark:text-neutral-100',
                },
                {
                  label: 'Perte max 1j (99%)',
                  value: riskMetrics.var_99,
                  format: (v: number) => `${v.toFixed(2)}%`,
                  colorCls: riskMetrics.var_99 < -3 ? 'border-l-red-500 dark:border-l-red-400 text-red-600 dark:text-red-400' : 'border-l-neutral-400 text-neutral-800 dark:text-neutral-100',
                },
                {
                  label: 'Drawdown max',
                  value: riskMetrics.max_drawdown,
                  format: (v: number) => `${v.toFixed(2)}%`,
                  colorCls: 'border-l-red-500 dark:border-l-red-400 text-red-600 dark:text-red-400',
                },
                {
                  label: 'Volatilité ann.',
                  value: riskMetrics.volatility,
                  format: (v: number) => `${v.toFixed(2)}%`,
                  colorCls: 'border-l-neutral-400 text-neutral-800 dark:text-neutral-100',
                },
                {
                  label: 'Sharpe ratio',
                  value: riskMetrics.sharpe_ratio,
                  format: (v: number) => v.toFixed(2),
                  colorCls: riskMetrics.sharpe_ratio > 1
                    ? 'border-l-emerald-500 dark:border-l-emerald-400 text-emerald-600 dark:text-emerald-400'
                    : riskMetrics.sharpe_ratio < 0
                    ? 'border-l-red-500 dark:border-l-red-400 text-red-600 dark:text-red-400'
                    : 'border-l-neutral-400 text-neutral-800 dark:text-neutral-100',
                },
              ].map(({ label, value, format, colorCls }) => (
                <div key={label} className={`analysis-metric-card rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/30 border-l-4 pl-3 pr-2 py-3 transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-px ${colorCls.split(' ')[0]}`}>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
                  <p className={`text-sm font-semibold tabular-nums ${colorCls.split(' ').slice(1).join(' ')}`}>
                    {format(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Corrélation entre actifs ──────────────────────────────────── */}
        <Card title="Corrélation entre actifs" className="md:col-span-2 lg:col-span-3">
          {correlationLoading && (
            <div className="flex items-center gap-2 text-[13px] text-neutral-500 dark:text-neutral-400">
              <Spinner size="sm" /> Calcul de la corrélation…
            </div>
          )}
          {!correlationLoading && correlationInsufficientAssets && (
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
              Ajoutez au moins 2 actifs à votre portefeuille pour voir leur corrélation.
            </p>
          )}
          {!correlationLoading && correlationError && (
            <Alert variant="error">{correlationError}</Alert>
          )}
          {!correlationLoading && correlation && (
            <CorrelationHeatmap labels={correlation.tickers} matrix={correlation.matrix} />
          )}
        </Card>

        {/* ── Historique des prédictions ────────────────────────────────── */}
        <Card title="Historique des prédictions">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-3">
            Dernières prédictions enregistrées. Cliquez sur « Réexécuter » pour relancer une analyse.
          </p>
          {predictionHistory.length === 0 ? (
            <p className="text-[12px] text-neutral-500 dark:text-neutral-500">Aucune prédiction enregistrée. Lancez une prédiction ci-dessus.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {[...predictionHistory].reverse().map((entry, i) => (
                <li key={`${entry.symbol}-${entry.date}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 -mx-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-[13px]">
                  <span className="font-medium text-neutral-800 dark:text-neutral-100">{entry.symbol}</span>
                  <span className="tabular-nums text-neutral-600 dark:text-neutral-400">{entry.value.toFixed(2)} USD</span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-500">{new Date(entry.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <Button variant="outline" className="flex-shrink-0" onClick={() => { setSymbol(entry.symbol); handlePredict(entry.symbol) }}>Réexécuter</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
