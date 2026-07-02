import { api, isCustomApiConfigured } from './api/client'
import type { InvestorProfile } from '@/store/slices/profileSlice'
import type { EtfRow } from './etfService'

function normalizeProfile(data: InvestorProfile): InvestorProfile {
  return { ...data, esg_preference: Boolean(data.esg_preference) }
}

export async function fetchProfile(): Promise<InvestorProfile | null> {
  if (!isCustomApiConfigured()) return null
  const { data, error } = await api.get<InvestorProfile>('/api/profile')
  if (error?.status === 404 || !data) return null
  return normalizeProfile(data)
}

export async function saveProfile(profile: InvestorProfile): Promise<{ profile: InvestorProfile | null; error: Error | null }> {
  const { data, error } = await api.post<InvestorProfile>('/api/profile', {
    risk_tolerance: profile.risk_tolerance,
    investment_horizon: profile.investment_horizon,
    investment_goal: profile.investment_goal,
    monthly_investment: profile.monthly_investment,
    esg_preference: profile.esg_preference,
    knowledge_level: profile.knowledge_level,
  })
  if (error) return { profile: null, error: new Error(error.message) }
  if (!data) return { profile: null, error: new Error('Réponse vide') }
  return { profile: normalizeProfile(data), error: null }
}

export async function fetchRecommendedEtfs(
  filters: { zone?: string; sector?: string; esg?: string; terMax?: string } = {}
): Promise<{ etfs: (EtfRow & { match_score: number })[]; error: Error | null }> {
  const params = new URLSearchParams()
  if (filters.zone) params.set('zone', filters.zone)
  if (filters.sector) params.set('sector', filters.sector)
  if (filters.esg) params.set('esg', filters.esg)
  if (filters.terMax) params.set('terMax', filters.terMax)
  const qs = params.toString() ? `?${params.toString()}` : ''

  const { data, error } = await api.get<{ etfs: (EtfRow & { match_score: number; match_breakdown?: { risk: number; horizon: number; esg: number; ter: number; goal: number } })[] }>(`/api/etfs/recommended${qs}`)
  if (error) return { etfs: [], error: new Error(error.message) }
  const etfs = (data?.etfs ?? []).map(e => ({ ...e, match: Math.round(e.match_score) }))
  return { etfs, error: null }
}
