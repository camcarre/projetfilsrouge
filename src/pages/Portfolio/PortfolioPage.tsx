import { useEffect, useState, useMemo } from 'preact/hooks'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { useToast } from '@/contexts/ToastContext'
import { setAssets } from '@/store/slices/portfolioSlice'
import { fetchAssets, addAsset, updateAsset, removeAsset } from '@/services/portfolioService'
import { isCustomApiConfigured } from '@/services/api/client'
import { formatCurrency } from '@/utils/format'
import { CombinedChart } from '@/components/ui/CombinedChart'
import type { Asset } from '@/store/slices/portfolioSlice'
import { getPortfolioHistory, type PortfolioHistoryEntry } from '@/services/portfolioService'
import type { RootState } from '@/store'

const CATEGORIES: Asset['category'][] = ['action', 'obligation', 'etf', 'crypto', 'autre']

const POPULAR_ASSETS = [
  { name: 'Amundi MSCI World (CW8)', symbol: 'CW8.PA', category: 'etf' },
  { name: 'Lyxor PEA Monde (EWLD)', symbol: 'EWLD.PA', category: 'etf' },
  { name: 'BNP S&P 500 (ESE)', symbol: 'ESE.PA', category: 'etf' },
  { name: 'Apple Inc.', symbol: 'AAPL', category: 'action' },
  { name: 'Microsoft Corp.', symbol: 'MSFT', category: 'action' },
  { name: 'LVMH', symbol: 'MC.PA', category: 'action' },
  { name: 'TotalEnergies', symbol: 'TTE.PA', category: 'action' },
  { name: 'Bitcoin', symbol: 'BTC-USD', category: 'crypto' },
  { name: 'Ethereum', symbol: 'ETH-USD', category: 'crypto' },
] as const

const GOALS_STORAGE_KEY = 'portfolio_goals'
type PortfolioGoals = { targetValue: number; horizonYears: number; monthlyDCA?: number }

function loadGoalsFromStorage(): PortfolioGoals | null {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw) as PortfolioGoals
    if (typeof o.targetValue !== 'number' || typeof o.horizonYears !== 'number') return null
    return { targetValue: o.targetValue, horizonYears: o.horizonYears, monthlyDCA: o.monthlyDCA }
  } catch {
    return null
  }
}
function saveGoalsToStorage(goals: PortfolioGoals) {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
}

export function PortfolioPage() {
  const dispatch = useDispatch()
  const user = useSelector((s: RootState) => s.auth.user)
  const [assets, setAssetsLocal] = useState<Asset[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [history, setHistory] = useState<PortfolioHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [requiresAuth, setRequiresAuth] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const [form, setForm] = useState({
    name: '',
    symbol: '',
    category: 'action' as Asset['category'],
    quantity: 0,
    unitPrice: 0,
    currency: 'EUR',
  })
  const [marketPrice, setMarketPrice] = useState<number | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [goals, setGoals] = useState<PortfolioGoals | null>(() => loadGoalsFromStorage())
  const [showGoalsForm, setShowGoalsForm] = useState(false)
  const [goalsForm, setGoalsForm] = useState({ targetValue: 50000, horizonYears: 5, monthlyDCA: 0 })
  type SortKey = 'name' | 'value' | 'symbol'
  const [sortBy, setSortBy] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedAssets = useMemo(() => {
    const list = [...assets]
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'symbol') cmp = a.symbol.localeCompare(b.symbol)
      else cmp = a.quantity * a.unitPrice - b.quantity * b.unitPrice
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [assets, sortBy, sortDir])

  const handleExportCsv = () => {
    const headers = 'Nom;Symbole;Catégorie;Quantité;Prix unitaire;Valeur\n'
    const rows = sortedAssets.map((a) => `${a.name};${a.symbol};${a.category};${a.quantity};${a.unitPrice};${a.quantity * a.unitPrice}`).join('\n')
    const blob = new Blob(['\ufeff' + headers + rows], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `portefeuille-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('asc') }
  }

  const { toast } = useToast()

  const needLogin = isCustomApiConfigured() && (!user || requiresAuth)

  const load = async () => {
    setLoading(true)
    const [assetsResult, historyResult] = await Promise.all([
      fetchAssets(),
      getPortfolioHistory()
    ])
    
    setAssetsLocal(assetsResult.assets)
    setTotalValue(assetsResult.totalValue)
    setRequiresAuth(assetsResult.requiresAuth ?? false)
    dispatch(setAssets(assetsResult.assets))
    
    // Si pas d'historique réel, on crée des points factices pour la démo
    if (historyResult.history.length < 2 && assetsResult.totalValue > 0) {
      const mockHist: PortfolioHistoryEntry[] = []
      const baseVal = assetsResult.totalValue * 0.85
      for (let i = 10; i >= 1; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        mockHist.push({
          date: d.toISOString(),
          totalValue: baseVal + (Math.random() * (assetsResult.totalValue - baseVal))
        })
      }
      mockHist.push({ date: new Date().toISOString(), totalValue: assetsResult.totalValue })
      setHistory(mockHist)
    } else {
      setHistory(historyResult.history)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openAddForm = () => {
    setEditingAsset(null)
    setForm({ name: '', symbol: '', category: 'action', quantity: 0, unitPrice: 0, currency: 'EUR' })
    setError(null)
    setShowForm(true)
  }

  const openEditForm = (a: Asset) => {
    setEditingAsset(a)
    setForm({
      name: a.name,
      symbol: a.symbol,
      category: a.category,
      quantity: a.quantity,
      unitPrice: a.unitPrice,
      currency: a.currency,
    })
    setError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingAsset(null)
    setForm({ name: '', symbol: '', category: 'action', quantity: 0, unitPrice: 0, currency: 'EUR' })
    setError(null)
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError(null)
    if (editingAsset) {
      const err = await updateAsset({
        ...editingAsset,
        name: form.name,
        symbol: form.symbol,
        category: form.category,
        quantity: form.quantity || 0,
        unitPrice: form.unitPrice || 0,
        currency: form.currency,
      })
      if (err.error) {
        setError(err.error.message)
        return
      }
      closeForm()
      toast('Actif mis à jour.', 'success')
      load()
    } else {
      const { asset: result, error: err } = await addAsset(
        { ...form, quantity: form.quantity || 0, unitPrice: form.unitPrice || 0 },
        'default'
      )
      if (err) {
        setError(err.message)
        return
      }
      if (result) {
        closeForm()
        toast('Actif ajouté.', 'success')
        load()
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return
    const id = assetToDelete.id
    setAssetToDelete(null)
    const { error: err } = await removeAsset(id)
    if (err) setError(err.message)
    else { toast('Actif supprimé.', 'success'); load() }
  }

  const inputClass =
    'w-full px-3.5 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/60 focus:border-neutral-400 dark:focus:ring-neutral-500/60 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 ease-out'

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-6">Gestion du portefeuille</h1>

      {needLogin && (
        <Card className="mb-5 border-neutral-300/80 dark:border-neutral-600/80 bg-neutral-50 dark:bg-neutral-800/40">
          <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-3">
            Connectez-vous pour accéder à votre portefeuille et enregistrer vos actifs.
          </p>
          <Link to="/auth">
            <Button variant="primary">Se connecter</Button>
          </Link>
        </Card>
      )}

      {/* Graphique de performance globale */}
      {assets.length > 0 && !needLogin && (
        <Card title="Évolution de la performance" className="mb-5 overflow-hidden">
          <div className="h-[200px] -mx-1">
            <CombinedChart 
              historical={history.map(h => h.totalValue)} 
              height={200}
              minimal={true}
              currency="EUR"
            />
          </div>
          <div className="mt-3 flex justify-between items-center text-[11px] text-neutral-500 dark:text-neutral-400">
             <span>Historique sur 30 jours</span>
             {history.length > 0 && (
               <span className="font-medium text-emerald-600 dark:text-emerald-400">
                 Dernier snapshot : {new Date(history[history.length-1].date).toLocaleDateString()}
               </span>
             )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <Card title="Valeur totale">
          <p className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums" aria-busy={loading}>
            {loading ? <span className="inline-block animate-pulse rounded bg-neutral-200 dark:bg-neutral-700 h-8 w-24 align-middle" aria-hidden /> : formatCurrency(totalValue)}
          </p>
          <p className="text-[12px] text-neutral-500 dark:text-neutral-400 mt-1">Valeur de marché des actifs enregistrés</p>
        </Card>
        <Card title="Répartition par catégorie">
          {loading || needLogin ? (
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">—</p>
          ) : assets.length === 0 ? (
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">Aucun actif. La répartition s&apos;affichera ici.</p>
          ) : (
            <ul className="text-[13px] text-neutral-600 dark:text-neutral-400 space-y-1.5">
              {CATEGORIES.map((cat) => {
                const count = assets.filter((a) => a.category === cat).length
                if (count === 0) return null
                const val = assets.filter((a) => a.category === cat).reduce((s, a) => s + a.quantity * a.unitPrice, 0)
                const pct = totalValue ? ((val / totalValue) * 100).toFixed(0) : '0'
                return (
                  <li key={cat} className="flex justify-between">
                    <span className="capitalize">{cat}</span>
                    <span className="tabular-nums font-medium text-neutral-800 dark:text-neutral-100">{pct} % · {formatCurrency(val)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Objectifs" className="mb-5">
        {!goals || showGoalsForm ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const g: PortfolioGoals = {
                targetValue: goalsForm.targetValue || 0,
                horizonYears: goalsForm.horizonYears || 1,
                monthlyDCA: goalsForm.monthlyDCA || undefined,
              }
              saveGoalsToStorage(g)
              setGoals(g)
              setShowGoalsForm(false)
            }}
            className="space-y-2.5"
          >
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Objectif de valorisation (€)</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={goalsForm.targetValue || ''}
                onChange={(e) => setGoalsForm((f) => ({ ...f, targetValue: Number((e.target as HTMLInputElement).value) || 0 }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Horizon (années)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={goalsForm.horizonYears || ''}
                onChange={(e) => setGoalsForm((f) => ({ ...f, horizonYears: Number((e.target as HTMLInputElement).value) || 1 }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">DCA mensuel optionnel (€)</label>
              <input
                type="number"
                min={0}
                step={50}
                value={goalsForm.monthlyDCA ?? ''}
                onChange={(e) => setGoalsForm((f) => ({ ...f, monthlyDCA: Number((e.target as HTMLInputElement).value) || 0 }))}
                className={inputClass}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary">Enregistrer</Button>
              {goals && <Button type="button" variant="secondary" onClick={() => setShowGoalsForm(false)}>Annuler</Button>}
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400">
              Objectif : <span className="font-semibold text-neutral-800 dark:text-neutral-100">{formatCurrency(goals.targetValue)}</span> dans <span className="font-medium">{goals.horizonYears} an{goals.horizonYears > 1 ? 's' : ''}</span>
              {goals.monthlyDCA ? ` · DCA ${formatCurrency(goals.monthlyDCA)}/mois` : ''}
            </p>
            {goals.targetValue > 0 && (
              <>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[13px] text-neutral-500 dark:text-neutral-400">Actuel</span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-100 tabular-nums">{formatCurrency(totalValue)}</span>
                  <span className="text-[13px] text-neutral-500 dark:text-neutral-400">→ Écart</span>
                  <span className={`tabular-nums font-medium ${totalValue >= goals.targetValue ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {totalValue >= goals.targetValue ? '+' : ''}{formatCurrency(totalValue - goals.targetValue)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (totalValue / goals.targetValue) * 100)}%` }}
                  />
                </div>
                <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                  {totalValue >= goals.targetValue ? 'Objectif atteint ou dépassé.' : `${((totalValue / goals.targetValue) * 100).toFixed(0)} % de l'objectif.`}
                </p>
              </>
            )}
            <Button variant="secondary" onClick={() => { setGoalsForm({ targetValue: goals.targetValue, horizonYears: goals.horizonYears, monthlyDCA: goals.monthlyDCA ?? 0 }); setShowGoalsForm(true) }}>Modifier les objectifs</Button>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <h2 className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-300 tracking-wide uppercase">Actifs</h2>
        {!needLogin && (
          <div className="flex gap-2">
            {assets.length > 0 && (
              <>
                <Button variant="outline" onClick={load} disabled={loading}>
                  {loading ? 'Actualisation...' : 'Actualiser les cours'}
                </Button>
                <Button variant="outline" onClick={handleExportCsv}>Exporter CSV</Button>
              </>
            )}
            <Button variant="primary" onClick={() => (showForm ? closeForm() : openAddForm())}>
              {showForm ? 'Annuler' : 'Ajouter un actif'}
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <Card className="mb-5" title={editingAsset ? 'Modifier l\'actif' : undefined}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!editingAsset && (
              <div>
                <label htmlFor="asset-selector" className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Sélectionner un actif populaire
                </label>
                <select
                  id="asset-selector"
                  className={inputClass}
                  onChange={async (e) => {
                    const val = (e.target as HTMLSelectElement).value
                    if (val === 'custom') {
                      setMarketPrice(null)
                      return
                    }
                    const asset = POPULAR_ASSETS.find(a => a.symbol === val)
                    if (asset) {
                      setForm(f => ({ ...f, symbol: asset.symbol, name: asset.name, category: asset.category as Asset['category'] }))
                      setLoadingPrice(true)
                      try {
                        const { getEtfDetails } = await import('@/services/etfService')
                        const details = await getEtfDetails(asset.symbol)
                        if (details && details.price) {
                          setMarketPrice(details.price)
                          setForm(f => ({ ...f, unitPrice: details.price }))
                        }
                      } catch (err) {
                        console.warn('Impossible de pré-remplir le prix:', err)
                      } finally {
                        setLoadingPrice(false)
                      }
                    }
                  }}
                >
                  <option value="custom">-- Choisir ou saisir manuellement --</option>
                  {POPULAR_ASSETS.map(a => (
                    <option key={a.symbol} value={a.symbol}>{a.name} ({a.symbol})</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="asset-name" className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Nom</label>
                <input
                  id="asset-name"
                  placeholder="Nom"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="asset-symbol" className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Symbole</label>
                <input
                  id="asset-symbol"
                  placeholder="Symbole (ex. AAPL)"
                  value={form.symbol}
                  onChange={(e) => setForm((f) => ({ ...f, symbol: (e.target as HTMLInputElement).value }))}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="asset-category" className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Catégorie</label>
                <select
                  id="asset-category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: (e.target as HTMLSelectElement).value as Asset['category'] }))}
                  className={inputClass}
                >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                </select>
              </div>
              <div>
                <label htmlFor="asset-quantity" className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">Quantité</label>
                <input
                  id="asset-quantity"
                  type="number"
                  placeholder="0.00"
                  value={form.quantity || ''}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: Number((e.target as HTMLInputElement).value) || 0 }))}
                  min={0}
                  step={0.0001}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Prix du marché (€)
                </label>
                <div className={`h-[38px] flex items-center px-3.5 border border-neutral-200 dark:border-neutral-700 rounded-lg ${POPULAR_ASSETS.some(a => a.symbol === form.symbol) ? 'bg-neutral-50 dark:bg-neutral-800/40' : 'bg-white dark:bg-neutral-900'}`}>
                  {loadingPrice ? (
                    <span className="text-[12px] text-neutral-400 animate-pulse">Récupération...</span>
                  ) : POPULAR_ASSETS.some(a => a.symbol === form.symbol) ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums">
                        {form.unitPrice.toFixed(2)} €
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Direct</span>
                      </span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      placeholder="0.00"
                      value={form.unitPrice || ''}
                      onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number((e.target as HTMLInputElement).value) || 0 }))}
                      className="w-full text-sm bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-100 tabular-nums"
                    />
                  )}
                </div>
              </div>
            </div>
            {error && (
              <Alert variant="error" id="portfolio-form-error" aria-live="polite">
                {error}
              </Alert>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" variant="primary" className="flex-1">{editingAsset ? 'Enregistrer les modifications' : 'Ajouter au portefeuille'}</Button>
              <Button type="button" variant="secondary" onClick={closeForm}>Annuler</Button>
            </div>
          </form>
        </Card>
      )}

      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 safe-area-padding-top" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="rounded-t-2xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl p-5 w-full max-w-sm max-h-[90vh] overflow-auto">
            <h3 id="delete-title" className="text-[14px] font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Supprimer l&apos;actif ?</h3>
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mb-4">
              {assetToDelete.name} ({assetToDelete.symbol}) — {formatCurrency(assetToDelete.quantity * assetToDelete.unitPrice)} sera retiré du portefeuille.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setAssetToDelete(null)}>Annuler</Button>
              <Button variant="primary" onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white">Supprimer</Button>
            </div>
          </div>
        </div>
      )}

      <Card title="Liste des actifs">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : needLogin ? (
          <p className="text-[13px] text-neutral-500 dark:text-neutral-500 leading-relaxed">Connectez-vous pour voir vos actifs.</p>
        ) : assets.length === 0 ? (
          <p className="text-[13px] text-neutral-500 dark:text-neutral-500 leading-relaxed">Aucun actif. Ajoute-en un avec le bouton ci-dessus.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 py-2 px-3 -mx-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              <span>Trier par :</span>
              <button type="button" onClick={() => toggleSort('name')} className={sortBy === 'name' ? 'text-neutral-800 dark:text-neutral-100 underline' : 'hover:text-neutral-700 dark:hover:text-neutral-200'}>Nom {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</button>
              <button type="button" onClick={() => toggleSort('symbol')} className={sortBy === 'symbol' ? 'text-neutral-800 dark:text-neutral-100 underline' : 'hover:text-neutral-700 dark:hover:text-neutral-200'}>Symbole {sortBy === 'symbol' && (sortDir === 'asc' ? '↑' : '↓')}</button>
              <button type="button" onClick={() => toggleSort('value')} className={sortBy === 'value' ? 'text-neutral-800 dark:text-neutral-100 underline' : 'hover:text-neutral-700 dark:hover:text-neutral-200'}>Valeur {sortBy === 'value' && (sortDir === 'asc' ? '↑' : '↓')}</button>
            </div>
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {sortedAssets.map((a) => {
              const currentVal = a.quantity * a.unitPrice
              const purchaseVal = a.quantity * (a.originalPrice ?? a.unitPrice)
              const profitLoss = currentVal - purchaseVal
              const profitLossPct = purchaseVal !== 0 ? (profitLoss / purchaseVal) * 100 : 0
              const isProfit = profitLoss >= 0

              return (
                <li key={a.id} className="py-4 px-3 -mx-3 rounded-xl flex flex-wrap items-center justify-between gap-4 text-[13px] transition-all duration-200 ease-out hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-100">{a.name}</span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 uppercase tracking-tight">{a.symbol}</span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-neutral-500 dark:text-neutral-400">
                      <span>{a.quantity} parts</span>
                      <span>·</span>
                      <span>PRU: <span className="tabular-nums font-medium">{formatCurrency(a.originalPrice ?? a.unitPrice)}</span></span>
                      <span>·</span>
                      <span>Cours: <span className="tabular-nums font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(a.unitPrice)}</span></span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-100 tabular-nums text-sm">
                      {formatCurrency(currentVal)}
                    </span>
                    <div className={`flex items-center gap-1.5 font-medium tabular-nums text-[11px] ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      <span>{isProfit ? '+' : ''}{formatCurrency(profitLoss)}</span>
                      <span className="opacity-60">·</span>
                      <span>{isProfit ? '+' : ''}{profitLossPct.toFixed(2)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0 w-full sm:w-auto sm:ml-4 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(a)}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[12px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-200"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetToDelete(a)}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          </>
        )}
      </Card>
    </div>
  )
}
