/**
 * Prédiction de cours – appelle le backend qui utilise l’API Hugging Face (Inference API, pas local).
 */
import { api, isCustomApiConfigured } from './api/client'

export interface StockPredictionResult {
  symbol: string
  prediction: unknown
}

/**
 * Prédiction de cours pour un symbole (ex. AAPL) via le backend → Hugging Face Inference API.
 * Nécessite d’être connecté (Bearer token).
 */
export async function getStockPrediction(
  symbol: string
): Promise<{ data: StockPredictionResult | null; error: { message: string } | null }> {
  if (!isCustomApiConfigured()) {
    return { data: null, error: { message: 'Backend non configuré' } }
  }
  const { data, error } = await api.get<StockPredictionResult>(
    `/api/predict/stock?symbol=${encodeURIComponent(symbol.trim())}`
  )
  if (error) return { data: null, error: { message: error.message } }
  return { data: data ?? null, error: null }
}
