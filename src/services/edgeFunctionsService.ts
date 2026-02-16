/**
 * Service Edge Functions – CDC 4.2.3 (Supabase Edge Functions pour calculs complexes), 7.2 (calculs financiers, APIs).
 */
import { supabase, isSupabaseConfigured } from './supabase/client'

/** Appel d'une Edge Function Supabase (calculs perf, risque, VaR, recommandations ETF – CDC 4.2.3). */
export async function invokeEdgeFunction<T = unknown>(
  name: string,
  payload?: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null, error: new Error('Supabase non configuré (Phase 1)') }
  }
  const { data, error } = await supabase.functions.invoke(name, { body: payload })
  if (error) return { data: null, error }
  return { data: (data as T) ?? null, error: null }
}

/** Exemple : calcul de performance / risque (à brancher sur une Edge Function en Phase 2). */
export async function computePortfolioMetrics(portfolioId: string): Promise<{
  performance?: number
  volatility?: number
  var?: number
  error: Error | null
}> {
  const { data, error } = await invokeEdgeFunction<{ performance?: number; volatility?: number; var?: number }>(
    'portfolio-metrics',
    { portfolio_id: portfolioId }
  )
  if (error) return { error }
  return {
    performance: data?.performance,
    volatility: data?.volatility,
    var: data?.var,
    error: null,
  }
}
