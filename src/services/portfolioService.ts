/**
 * Service portefeuille – API custom (ton back), Supabase ou mock.
 * Priorité : VITE_API_URL > Supabase > mock.
 */
import { supabase, isSupabaseConfigured } from './supabase/client'
import { api, isCustomApiConfigured } from './api/client'
import type { Asset } from '@/store/slices/portfolioSlice'
import { fetchMockPortfolio } from './api/mockApi'

type AssetRow = {
  id: string
  name: string
  symbol: string
  category: string
  quantity: number
  unit_price?: number
  unitPrice?: number
  currency: string
}

function mapRowToAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    category: row.category as Asset['category'],
    quantity: row.quantity,
    unitPrice: row.unit_price ?? row.unitPrice ?? 0,
    currency: row.currency,
  }
}

/** Liste des actifs du portefeuille. */
export async function fetchAssets(portfolioId?: string): Promise<{ assets: Asset[]; totalValue: number }> {
  if (isCustomApiConfigured()) {
    const qs = portfolioId ? `?portfolioId=${encodeURIComponent(portfolioId)}` : ''
    const { data, error } = await api.get<{ assets: AssetRow[]; totalValue?: number }>(`/api/assets${qs}`)
    if (error) return { assets: [], totalValue: 0 }
    const assets = (data?.assets ?? []).map(mapRowToAsset)
    const totalValue = data?.totalValue ?? assets.reduce((s, a) => s + a.quantity * a.unitPrice, 0)
    return { assets, totalValue }
  }
  if (isSupabaseConfigured() && supabase) {
    const query = supabase.from('assets').select('*').order('created_at', { ascending: false })
    if (portfolioId) query.eq('portfolio_id', portfolioId)
    const { data, error } = await query
    if (error) return { assets: [], totalValue: 0 }
    const assets = (data ?? []).map((r: AssetRow) => mapRowToAsset(r))
    const totalValue = assets.reduce((s: number, a: Asset) => s + a.quantity * a.unitPrice, 0)
    return { assets, totalValue }
  }
  const mock = await fetchMockPortfolio()
  return { assets: mock.assets ?? [], totalValue: mock.totalValue ?? 0 }
}

/** Ajout d'un actif. */
export async function addAsset(asset: Omit<Asset, 'id'>, portfolioId: string): Promise<{ asset: Asset | null; error: Error | null }> {
  if (isCustomApiConfigured()) {
    const { data, error } = await api.post<{ asset: AssetRow }>('/api/assets', {
      portfolioId,
      name: asset.name,
      symbol: asset.symbol,
      category: asset.category,
      quantity: asset.quantity,
      unitPrice: asset.unitPrice,
      currency: asset.currency,
    })
    if (error) return { asset: null, error: new Error(error.message) }
    return { asset: data?.asset ? mapRowToAsset(data.asset) : null, error: null }
  }
  if (isSupabaseConfigured() && supabase) {
    const row = {
      portfolio_id: portfolioId,
      name: asset.name,
      symbol: asset.symbol,
      category: asset.category,
      quantity: asset.quantity,
      unit_price: asset.unitPrice,
      currency: asset.currency,
    }
    const { data, error } = await supabase.from('assets').insert(row as never).select('*').single()
    if (error) return { asset: null, error }
    return { asset: data ? mapRowToAsset(data) : null, error: null }
  }
  return { asset: null, error: new Error('Aucun backend configuré') }
}

/** Mise à jour d'un actif. */
export async function updateAsset(asset: Asset): Promise<{ error: Error | null }> {
  if (isCustomApiConfigured()) {
    const { error } = await api.put(`/api/assets/${asset.id}`, {
      name: asset.name,
      symbol: asset.symbol,
      category: asset.category,
      quantity: asset.quantity,
      unitPrice: asset.unitPrice,
      currency: asset.currency,
    })
    return { error: error ? new Error(error.message) : null }
  }
  if (isSupabaseConfigured() && supabase) {
  const updateRow = {
    name: asset.name,
    symbol: asset.symbol,
    category: asset.category,
    quantity: asset.quantity,
    unit_price: asset.unitPrice,
    currency: asset.currency,
  }
  const { error } = await supabase.from('assets').update(updateRow as never).eq('id', asset.id)
    return { error: error ?? null }
  }
  return { error: new Error('Aucun backend configuré') }
}

/** Suppression d'un actif. */
export async function removeAsset(assetId: string): Promise<{ error: Error | null }> {
  if (isCustomApiConfigured()) {
    const { error } = await api.delete(`/api/assets/${assetId}`)
    return { error: error ? new Error(error.message) : null }
  }
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('assets').delete().eq('id', assetId)
    return { error: error ?? null }
  }
  return { error: new Error('Aucun backend configuré') }
}
