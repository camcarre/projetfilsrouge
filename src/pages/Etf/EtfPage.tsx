import { useState, useEffect, useMemo } from 'preact/hooks'
import { useSelector } from 'react-redux'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'

import { fetchEtfs, type EtfRow } from '@/services/etfService'
import { fetchRecommendedEtfs } from '@/services/profileService'
import { fetchEtfHistory, formatHistoryForChart } from '@/services/etfHistoryService'
import { CombinedChart } from '@/components/ui/CombinedChart'
import { MultiLineChart, type MultiLineSeries as Series } from "@/components/ui/MultiLineChart"
import type { RootState } from '@/store'

const SECTORS = ['Tous', 'Large cap', 'ESG', 'Emerging', 'Sectoriel', 'Diversifié']
const ZONES = ['Toutes', 'Monde', 'Europe', 'USA', 'Émergents', 'Japon', 'Asie Pacifique']
const ESG_OPTS = ['Tous', 'AAA', 'AA', 'A', 'B']
const DISTRIBUTION = ['Tous', 'Capitalisant', 'Distribuant']
const TER_MAX = ['Tous', '≤ 0,10 %', '≤ 0,20 %', '≤ 0,30 %', '≤ 0,50 %']

export function EtfPage() {
  const profile = useSelector((state: RootState) => state.profile.profile)
  const hasProfile = profile !== null

  const [sector, setSector] = useState('Tous')
  const [zone, setZone] = useState('Toutes')
  const [esg, setEsg] = useState('Tous')
  const [distribution, setDistribution] = useState('Tous')
  const [terMax, setTerMax] = useState('Tous')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareSelected, setCompareSelected] = useState<EtfRow[]>([])
  const [compareChartData, setCompareChartData] = useState<Series[]>([])
  const [compareChartLoading, setCompareChartLoading] = useState(false)
  const [etfs, setEtfs] = useState<EtfRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mainChartData, setMainChartData] = useState<{date: string, value: number}[]>([])
  const [selectedEtf, setSelectedEtf] = useState<EtfRow | null>(null)
  const [selectedChartData, setSelectedChartData] = useState<{date: string, value: number}[]>([])

  useEffect(() => {
    const data = []
    for (let i = 90; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const value = 100 + Math.sin(i / 10) * 10 + Math.random() * 5
      data.push({ date: date.toISOString().split('T')[0], value: parseFloat(value.toFixed(2)) })
    }
    setMainChartData(data)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const loadEtfs = hasProfile
      ? fetchRecommendedEtfs({ zone, sector, esg, terMax })
      : fetchEtfs({ zone, sector, esg, terMax })

    loadEtfs.then(({ etfs: list, error: err }) => {
      setEtfs(list as EtfRow[])
      setError(err?.message ?? null)
      setLoading(false)
    })
  }, [sector, zone, esg, terMax, hasProfile])

  const filteredEtfs = useMemo(() => {
    if (!searchQuery) return etfs
    
    const query = searchQuery.toLowerCase()
    return etfs.filter(etf => 
      etf.name.toLowerCase().includes(query) ||
      etf.ticker.toLowerCase().includes(query) ||
      etf.theme.toLowerCase().includes(query) ||
      etf.zone.toLowerCase().includes(query)
    )
  }, [etfs, searchQuery])

  // Fonction pour sélectionner un ETF et afficher son graphique avec VRAIES données
  const handleSelectEtf = async (etf: EtfRow) => {
    setSelectedEtf(etf)
    setLoading(true)
    
    try {
      // Récupérer les vraies données historiques depuis Yahoo Finance
      const historyData = await fetchEtfHistory(etf.ticker, '3mo')
      const chartData = formatHistoryForChart(historyData)
      setSelectedChartData(chartData)
    } catch (error) {
      console.error(`[handleSelectEtf] Erreur pour ${etf.ticker}:`, error)
      // En cas d'erreur, utiliser des données mock comme fallback
      const fallbackData = []
      const baseValue = 100
      const volatility = Math.abs(etf.perf1y || 0) / 100
      
      for (let i = 90; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const trend = (etf.perf1y >= 0 ? 1 : -1) * 0.1
        const value = baseValue + (90 - i) * trend + (Math.random() - 0.5) * volatility * 2
        
        fallbackData.push({
          date: date.toISOString().split('T')[0],
          value: parseFloat(Math.max(50, Math.min(150, value)).toFixed(2))
        })
      }
      setSelectedChartData(fallbackData)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCsv = () => {
    const headers = 'Nom;Ticker;Zone;Thème;TER (%);Perf 1 an (%);ESG;Match (%)\n'
    const rows = filteredEtfs.map((e) => `${e.name};${e.ticker};${e.zone};${e.theme};${e.ter};${e.perf1y};${e.esg};${e.match}`).join('\n')
    const blob = new Blob(['\ufeff' + headers + rows], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `etf-recommandations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const resetFilters = () => {
    setSector('Tous')
    setZone('Toutes')
    setEsg('Tous')
    setTerMax('Tous')
    setDistribution('Tous')
    setSearchQuery('')
  }

  const toggleCompare = (etf: EtfRow) => {
    setCompareSelected((prev) => {
      const has = prev.some((e) => e.id === etf.id)
      if (has) return prev.filter((e) => e.id !== etf.id)
      if (prev.length >= 3) return prev
      return [...prev, etf]
    })
  }

  useEffect(() => {
    if (!compareOpen || compareSelected.length < 2) {
      setCompareChartData([])
      return
    }

    let cancelled = false
    setCompareChartLoading(true)

    Promise.allSettled(compareSelected.map((etf) => fetchEtfHistory(etf.ticker, '3mo'))).then((results) => {
      if (cancelled) return
      const PALETTE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
      const series: Series[] = results.map((result, i) => {
        const etf = compareSelected[i]
        const color = PALETTE[i % PALETTE.length]
        if (result.status === 'fulfilled') {
          return { key: etf.ticker, name: etf.ticker, color, data: formatHistoryForChart(result.value) }
        }
        return { key: etf.ticker, name: etf.ticker, color, data: [] } as Series
      })
      setCompareChartData(series)
      setCompareChartLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [compareOpen, compareSelected])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">
          Recommandations ETF
        </h1>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-4">
          Aperçu du moteur de recommandation selon votre profil, frais et critères ESG.
        </p>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Rechercher par nom, ticker, zone ou thème..."
          />
        </div>
      </div>

      {/* Filtres */}
      <Card title="Filtres" className="mb-5">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Secteur / Thème</p>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSector(s)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                    sector === s
                      ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Zone géographique</p>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZone(z)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                    zone === z
                      ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Score ESG minimum</p>
            <div className="flex flex-wrap gap-2">
              {ESG_OPTS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEsg(e)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                    esg === e
                      ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
            >
              {showAdvanced ? '− Critères avancés' : '+ Critères avancés'}
            </button>
            {showAdvanced && (
              <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                <div>
                  <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Distribution</p>
                  <div className="flex flex-wrap gap-2">
                    {DISTRIBUTION.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDistribution(d)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                          distribution === d
                            ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">TER maximum</p>
                  <div className="flex flex-wrap gap-2">
                    {TER_MAX.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTerMax(t)}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 ${
                          terMax === t
                            ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Graphique principal - ETF sélectionné ou marché global */}
      <div className="mb-5">
        {selectedEtf ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                {selectedEtf.name} - Performance 90j
              </h3>
              <button
                onClick={() => setSelectedEtf(null)}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                ← Retour au marché global
              </button>
            </div>
            <CombinedChart 
              historical={selectedChartData.map(d => d.value)}
              height={250}
            />
          </div>
        ) : (
          <CombinedChart 
            historical={mainChartData.map(d => d.value)}
            height={250}
          />
        )}
      </div>

      {/* Score de correspondance (simulé) */}
      <Card title="Profil & correspondance" className="mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">Risque</p>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Modéré</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">Horizon</p>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">&gt; 5 ans</p>
          </div>
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">ESG</p>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Prioritaire</p>
          </div>
          <div className="rounded-xl border border-l-4 border-l-emerald-500 dark:border-l-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">Match moyen</p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">88 %</p>
          </div>
        </div>
      </Card>

      {/* Liste des ETF recommandés */}
      <Card title="ETF recommandés (aperçu)">
        <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4">
          {selectedEtf 
            ? `ETF sélectionné : ${selectedEtf.name}. Cliquez sur un autre ETF pour changer ou sur le bouton ci-dessus pour revenir au marché global.`
            : "Cliquez sur un ETF pour voir ses performances détaillées."
          }
        </p>
        {error && (
          <Alert variant="error" className="mb-4" id="etf-error">
            {error}
          </Alert>
        )}
        <ul className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3 px-4 -mx-4 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
                <Skeleton className="h-6 w-12" />
              </li>
            ))
          ) : filteredEtfs.length === 0 ? (
            <li className="py-8 flex flex-col items-center gap-3 text-center">
              <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                Aucun ETF ne correspond à ces filtres.
              </p>
              <Button variant="secondary" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </li>
          ) : (
          filteredEtfs.map((etf) => (
            <li
              key={etf.id}
              className={`flex flex-wrap items-center justify-between gap-3 py-3 px-4 -mx-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                selectedEtf?.id === etf.id 
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
                  : compareSelected.some((e) => e.id === etf.id) 
                    ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20' 
                    : 'border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30'
              }`}
              onClick={() => {
                if (compareOpen) {
                  toggleCompare(etf)
                } else {
                  handleSelectEtf(etf)
                }
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-800 dark:text-neutral-100 truncate">{etf.name}</p>
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {etf.ticker} · {etf.zone} · {etf.theme}
                </p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-[12px] text-neutral-500 dark:text-neutral-400 tabular-nums">TER {etf.ter} %</span>
                <span className="text-[12px] text-neutral-500 dark:text-neutral-400 tabular-nums">{etf.perf1y} % 1 an</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300">
                  ESG {etf.esg}
                </span>
                <span className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums w-10 text-right">
                  {etf.match} %
                </span>
              </div>
              {(etf as any).match_breakdown && (
                <details className="mt-2 ml-0 sm:ml-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <summary className="cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400">
                    Détail du score
                  </summary>
                  <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-5 gap-x-3 gap-y-0.5 tabular-nums">
                    <span>risk: <b className="text-emerald-600 dark:text-emerald-400">{(etf as any).match_breakdown.risk}</b> pts</span>
                    <span>horizon: <b className="text-emerald-600 dark:text-emerald-400">{(etf as any).match_breakdown.horizon}</b> pts</span>
                    <span>esg: <b className="text-emerald-600 dark:text-emerald-400">{(etf as any).match_breakdown.esg}</b> pts</span>
                    <span>ter: <b className="text-neutral-700 dark:text-neutral-200">{(etf as any).match_breakdown.ter}</b> pts</span>
                    <span>goal: <b className="text-emerald-600 dark:text-emerald-400">{(etf as any).match_breakdown.goal}</b> pts</span>
                  </div>
                </details>
              )}
            </li>
          )))}
        </ul>
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setCompareOpen(!compareOpen)}>
            {compareOpen ? `Comparer (${compareSelected.length}/3)` : 'Comparer une sélection'}
          </Button>
          <Button variant="outline" onClick={handleExportCsv}>Exporter la liste</Button>
        </div>
      </Card>

      {compareOpen && (
        <Card className="mt-5" title="Comparer des ETF (sélectionnez jusqu’à 3)">
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mb-4">Cliquez sur une ligne de la liste ci-dessus pour l’ajouter ou la retirer.</p>
          {compareSelected.length >= 2 && (
            <div className="mb-5">
              {compareChartLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <MultiLineChart series={compareChartData} />
              )}
            </div>
          )}
          {compareSelected.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="text-left py-2 pr-2 font-medium text-neutral-600 dark:text-neutral-400">Nom</th>
                    <th className="text-left py-2 pr-2 font-medium text-neutral-600 dark:text-neutral-400">TER</th>
                    <th className="text-left py-2 pr-2 font-medium text-neutral-600 dark:text-neutral-400">Perf 1 an</th>
                    <th className="text-left py-2 pr-2 font-medium text-neutral-600 dark:text-neutral-400">ESG</th>
                    <th className="text-left py-2 font-medium text-neutral-600 dark:text-neutral-400">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {compareSelected.map((e) => (
                    <tr key={e.id} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-2 text-neutral-800 dark:text-neutral-100">{e.name}</td>
                      <td className="py-2 pr-2 tabular-nums">{e.ter} %</td>
                      <td className="py-2 pr-2 tabular-nums">{e.perf1y} %</td>
                      <td className="py-2 pr-2">{e.esg}</td>
                      <td className="py-2 tabular-nums text-emerald-600 dark:text-emerald-400">{e.match} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">Aucune sélection. Cliquez sur les lignes de la liste ci-dessus.</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={() => { setCompareOpen(false); setCompareSelected([]) }}>Fermer</Button>
          </div>
        </Card>
      )}

      <Card title="Comment est calculé le score ?" className="mt-5">
        <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-2">
          Le score de correspondance combine : adéquation au profil de risque, horizon d&apos;investissement,
          préférence ESG, niveau de frais (TER), liquidité et tracking error. Plus le score est élevé, plus l&apos;ETF
          correspond à vos critères.
        </p>
        <p className="text-[12px] text-neutral-500 dark:text-neutral-500">
          Les données (TER, performance, ESG) sont indicatives et peuvent varier. Vérifiez sur le site de l&apos;émetteur avant d&apos;investir.
        </p>
      </Card>
    </div>
  )
}
