import { api, isCustomApiConfigured } from './api/client'
import type { IndicatorsResponse, RiskMetrics } from '@/types/analytics'

export async function getIndicators(
  ticker: string,
  period = '3mo'
): Promise<{ data: IndicatorsResponse | null; error: Error | null }> {
  if (!isCustomApiConfigured()) {
    return { data: null, error: new Error('Backend non configuré') }
  }
  const { data, error } = await api.get<IndicatorsResponse>(
    `/api/analyze/indicators/${encodeURIComponent(ticker.trim())}?period=${period}`
  )
  if (error) return { data: null, error: new Error(error.message) }
  return { data: data ?? null, error: null }
}

export async function getRiskMetrics(
  ticker: string,
  period = '1y'
): Promise<{ data: RiskMetrics | null; error: Error | null }> {
  if (!isCustomApiConfigured()) {
    return { data: null, error: new Error('Backend non configuré') }
  }
  const { data, error } = await api.get<RiskMetrics>(
    `/api/analyze/risk/${encodeURIComponent(ticker.trim())}?period=${period}`
  )
  if (error) return { data: null, error: new Error(error.message) }
  return { data: data ?? null, error: null }
}
