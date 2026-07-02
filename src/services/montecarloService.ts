import { api, isCustomApiConfigured } from './api/client'
import type { MonteCarloResult } from '@/types/montecarlo'

/** Simulation Monte Carlo de la valeur future du portefeuille. */
export async function getMonteCarlo(
  days = 30,
  simulations = 1000
): Promise<{ data: MonteCarloResult | null; error: Error | null }> {
  if (!isCustomApiConfigured()) {
    return { data: null, error: new Error('Backend non configuré') }
  }
  const { data, error } = await api.get<MonteCarloResult>(
    `/api/portfolio/montecarlo?days=${days}&simulations=${simulations}`
  )
  if (error) return { data: null, error: new Error(error.message) }
  return { data: data ?? null, error: null }
}
