import { useEffect, useState } from 'preact/hooks'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { fetchAssets, getPortfolioHistory, type PortfolioHistoryEntry } from '@/services/portfolioService'
import { isCustomApiConfigured } from '@/services/api/client'
import { formatCurrency } from '@/utils/format'
import type { RootState } from '@/store'

const QUICK_LINKS = [
  { to: '/portfolio', label: 'Portefeuille', desc: 'Actifs et valeur totale' },
  { to: '/analysis', label: 'Analyse', desc: 'Prédiction de cours' },
  { to: '/etf', label: 'Recommandations ETF', desc: 'Filtres et match' },
  { to: '/education', label: 'Éducation', desc: 'Guides et glossaire' },
] as const

const KPI_PERIODS = ['7J', '1M', '3M', '12M', 'Tout'] as const

function getDateRange(period: (typeof KPI_PERIODS)[number]): { from: string; to: string } {
  const to = new Date()
  const toStr = to.toISOString().slice(0, 10)
  const from = new Date()
  if (period === '7J') from.setDate(from.getDate() - 7)
  else if (period === '1M') from.setMonth(from.getMonth() - 1)
  else if (period === '3M') from.setMonth(from.getMonth() - 3)
  else if (period === '12M') from.setFullYear(from.getFullYear() - 1)
  else from.setFullYear(from.getFullYear() - 2)
  const fromStr = from.toISOString().slice(0, 10)
  return { from: fromStr, to: toStr }
}

const CHART_W = 560
const CHART_H = 220
const PAD = { top: 16, right: 16, bottom: 28, left: 48 }

function PortfolioChart({ history, periodLabel }: { history: PortfolioHistoryEntry[]; periodLabel: string }) {
  if (history.length < 2) return null
  const values = history.map((h) => h.totalValue)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = CHART_W - PAD.left - PAD.right
  const h = CHART_H - PAD.top - PAD.bottom
  const toY = (v: number) => PAD.top + h - ((v - min) / range) * h
  const points = history.map((h, i) => {
    const x = history.length <= 1 ? PAD.left : PAD.left + (i / (history.length - 1)) * w
    return `${x},${toY(h.totalValue)}`
  })
  const pathD = `M ${points.join(' L ')}`
  const areaD = `M ${PAD.left},${PAD.top + h} L ${points.join(' L ')} L ${PAD.left + w},${PAD.top + h} Z`
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 overflow-hidden">
      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 px-4 pt-2">{periodLabel}</p>
      <svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="overflow-visible" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="portfolio-chart-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#portfolio-chart-gradient)" />
        <path d={pathD} fill="none" stroke="rgb(16 185 129)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x={PAD.left - 4} y={PAD.top + h / 2} textAnchor="end" className="text-[10px] fill-neutral-500 dark:fill-neutral-400" dominantBaseline="middle">{formatCurrency(min)}</text>
        <text x={PAD.left - 4} y={PAD.top} textAnchor="end" className="text-[10px] fill-neutral-500 dark:fill-neutral-400" dominantBaseline="hanging">{formatCurrency(max)}</text>
      </svg>
    </div>
  )
}

export function DashboardPage() {
  const user = useSelector((s: RootState) => s.auth.user)
  const [loading, setLoading] = useState(true)
  const [totalValue, setTotalValue] = useState(0)
  const [assetCount, setAssetCount] = useState(0)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [kpiPeriod, setKpiPeriod] = useState<(typeof KPI_PERIODS)[number]>('12M')
  const [history, setHistory] = useState<PortfolioHistoryEntry[]>([])
  const [history12M, setHistory12M] = useState<PortfolioHistoryEntry[]>([])

  const apiConfigured = isCustomApiConfigured()
  const canLoadPortfolio = apiConfigured && !!user

  useEffect(() => {
    if (!canLoadPortfolio) {
      setLoading(false)
      setTotalValue(0)
      setAssetCount(0)
      setHistory([])
      return
    }
    let cancelled = false
    setLoading(true)
    fetchAssets()
      .then(({ assets, totalValue: tv, requiresAuth: ra }) => {
        if (cancelled) return
        setTotalValue(tv)
        setAssetCount(assets.length)
        setRequiresAuth(ra ?? false)
      })
      .catch(() => {
        if (!cancelled) setTotalValue(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [canLoadPortfolio, user?.id])

  useEffect(() => {
    if (!canLoadPortfolio) return
    const { from, to } = getDateRange(kpiPeriod)
    let cancelled = false
    getPortfolioHistory(from, to).then(({ history: h }) => {
      if (!cancelled) setHistory(h)
    })
    return () => { cancelled = true }
  }, [canLoadPortfolio, user?.id, kpiPeriod])

  useEffect(() => {
    if (!canLoadPortfolio) return
    const { from, to } = getDateRange('12M')
    let cancelled = false
    getPortfolioHistory(from, to).then(({ history: h }) => {
      if (!cancelled) setHistory12M(h)
    })
    return () => { cancelled = true }
  }, [canLoadPortfolio, user?.id])

  const showPortfolioData = canLoadPortfolio && !requiresAuth
  const perf12M = showPortfolioData && history12M.length >= 2
    ? ((history12M[history12M.length - 1].totalValue - history12M[0].totalValue) / history12M[0].totalValue) * 100
    : null

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">
        Tableau de bord
      </h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-4">
        Vue d&apos;ensemble et accès rapide aux outils.
      </p>

      {/* Filtre période KPI */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Période</span>
        <div className="flex flex-wrap gap-1.5">
          {KPI_PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setKpiPeriod(p)}
              className={`px-3 py-2 min-h-[44px] rounded-lg text-[12px] font-medium transition-all duration-300 ease-out ${
                kpiPeriod === p
                  ? 'bg-neutral-800 text-white shadow-sm dark:bg-neutral-200 dark:text-neutral-900'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:scale-[1.03] active:scale-[0.98] dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="dashboard-stat rounded-2xl border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 pl-4 pr-4 py-4 border-l-4 border-l-emerald-500 dark:border-l-emerald-400 transition-all duration-300 ease-out hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:-translate-y-px hover:border-neutral-300 dark:hover:border-neutral-600">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Valeur portefeuille</p>
          {loading ? (
            <Skeleton className="h-7 w-24" />
          ) : showPortfolioData ? (
            <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums">{formatCurrency(totalValue)}</p>
          ) : (
            <p className="text-lg font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">—</p>
          )}
          {!apiConfigured && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Backend non configuré</p>}
          {apiConfigured && !user && <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Connectez-vous</p>}
        </div>

        <div className="dashboard-stat rounded-2xl border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 px-4 py-4 transition-all duration-300 ease-out hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:-translate-y-px hover:border-neutral-300 dark:hover:border-neutral-600">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Performance 12M</p>
          {perf12M !== null ? (
            <>
              <p className={`text-xl font-semibold tabular-nums ${perf12M >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {perf12M >= 0 ? '+' : ''}{perf12M.toFixed(1)} %
              </p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Sur les 12 derniers mois</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">—</p>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Historique 12M requis</p>
            </>
          )}
        </div>

        <div className="dashboard-stat rounded-2xl border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 pl-4 pr-4 py-4 border-l-4 border-l-slate-400 dark:border-l-slate-500 transition-all duration-300 ease-out hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:-translate-y-px hover:border-neutral-300 dark:hover:border-neutral-600">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Nombre d&apos;actifs</p>
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : showPortfolioData ? (
            <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums">{assetCount}</p>
          ) : (
            <p className="text-lg font-medium text-neutral-400 dark:text-neutral-500 tabular-nums">—</p>
          )}
        </div>

        <div className="dashboard-stat rounded-2xl border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-900/50 px-4 py-4 transition-all duration-300 ease-out hover:shadow-card-hover dark:hover:shadow-card-hover-dark hover:-translate-y-px hover:border-neutral-300 dark:hover:border-neutral-600">
          <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">ETF recommandés</p>
          <Link to="/etf" className="block">
            <p className="text-lg font-medium text-neutral-800 dark:text-neutral-100 tabular-nums hover:underline">Voir les ETF</p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Filtres et score de match</p>
          </Link>
        </div>
      </div>

      {/* Graphique évolution */}
      <Card title="Évolution du portefeuille" className="mb-5">
        <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-3">
          Période : <span className="font-medium text-neutral-700 dark:text-neutral-300">{kpiPeriod}</span>
          {!apiConfigured || !user ? ' — Connectez-vous et utilisez le portefeuille pour voir l\'historique.' : ''}
        </p>
        {!canLoadPortfolio || requiresAuth ? (
          <div className="rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-center min-h-[220px] transition-all duration-300 ease-out">
            <p className="text-[14px] text-neutral-500 dark:text-neutral-400">Connectez-vous pour afficher l&apos;évolution.</p>
          </div>
        ) : history.length >= 2 ? (
          <PortfolioChart history={history} periodLabel={`${history.length} points · ${formatCurrency(history[0]?.totalValue ?? 0)} → ${formatCurrency(history[history.length - 1]?.totalValue ?? 0)}`} />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 flex items-center justify-center min-h-[220px] transition-all duration-300 ease-out">
            <div className="text-center px-4 py-8">
              <p className="text-[14px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">Pas encore de données</p>
              <p className="text-[12px] text-neutral-400 dark:text-neutral-500">
                Consultez votre portefeuille régulièrement : un point sera enregistré à chaque visite pour construire la courbe.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Accès rapides */}
      <Card title="Accès rapides" className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ to, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/50 hover:shadow-sm hover:-translate-y-px transition-all duration-300 ease-out group"
            >
              <span className="font-medium text-neutral-800 dark:text-neutral-100 group-hover:text-neutral-900 dark:group-hover:text-white">{label}</span>
              <span className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">{desc}</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Vue d'ensemble">
          <ul className="text-[13px] text-neutral-600 dark:text-neutral-400 space-y-2">
            <li>· Indicateurs clés (valeur, performance, nombre d&apos;actifs)</li>
            <li>· Diversification et répartition par catégorie</li>
            <li>· Alertes personnalisables (seuils, actualités)</li>
            <li>· Synthèse des recommandations ETF selon le profil</li>
          </ul>
        </Card>
        <Card title="Performance">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-3">
            Graphiques de performance du portefeuille (évolution, comparatif indice).
          </p>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-500">
            Courbes personnalisables par période (1M, 6M, 1Y, MAX). Export des données.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card title="Alertes">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-2">
            Notifications et alertes : seuils de prix, variation journalière, dividendes.
          </p>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-500">
            Configurez vos préférences dans les Paramètres.
          </p>
          <Link to="/settings" className="inline-block mt-2">
            <Button variant="secondary">Paramètres</Button>
          </Link>
        </Card>
        <Card title="Diversification">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
            Répartition actions / obligations / ETF / crypto. Cible d&apos;allocation et écart.
          </p>
        </Card>
        <Card title="Ressources">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
            Glossaire, guides, quiz et calculatrices (intérêts composés, DCA, retraite).
          </p>
          <Link to="/education" className="inline-block mt-2">
            <Button variant="secondary">Voir l&apos;éducation</Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
