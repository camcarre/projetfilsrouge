import { api } from './api/client'

export interface EtfHistoryPoint {
  date: string
  value: number
  volume?: number
  open?: number
  high?: number
  low?: number
}

export interface EtfHistoryResponse {
  ticker: string
  data: EtfHistoryPoint[]
  period: string
  count: number
}

/**
 * Récupère les données historiques d'un ETF pour les graphiques
 * @param ticker - Le ticker de l'ETF (ex: "EWLD.PA")
 * @param period - La période (1mo, 3mo, 6mo, 1y, 2y)
 * @returns Les données historiques formatées pour les graphiques
 */
export async function fetchEtfHistory(ticker: string, period: string = '3mo'): Promise<EtfHistoryResponse> {
  try {
    const { data, error } = await api.get<EtfHistoryResponse>(`/api/etfs/${encodeURIComponent(ticker)}/history?period=${period}`)
    
    if (error) {
      throw new Error(error.message || 'Erreur lors de la récupération des données historiques')
    }
    
    if (!data) {
      throw new Error('Aucune donnée reçue')
    }
    
    return data
  } catch (error) {
    console.error(`[fetchEtfHistory] Erreur pour ${ticker}:`, error)
    throw error
  }
}

/**
 * Transforme les données historiques pour le composant Chart
 * @param historyData - Données brutes de l'API
 * @returns Données formatées pour Recharts
 */
export function formatHistoryForChart(historyData: EtfHistoryResponse): Array<{date: string, value: number}> {
  if (!historyData.data || historyData.data.length === 0) {
    return []
  }
  
  return historyData.data.map(point => ({
    date: point.date,
    value: point.value
  }))
}