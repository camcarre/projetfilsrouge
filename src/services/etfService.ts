/**
 * Service ETF – appelle l'API backend (Yahoo Finance) ou mock.
 */
import { api, isCustomApiConfigured } from './api/client'

export type EtfRow = {
  id: string
  name: string
  ticker: string
  ter: number
  perf1y: number
  esg: string
  match: number
  zone: string
  theme: string
}

type FetchEtfsFilters = {
  zone?: string
  sector?: string
  esg?: string
  terMax?: string
}

/** Données mock de repli si l'API n'est pas configurée */
const MOCK_ETFS: EtfRow[] = [
  { id: '1', name: 'iShares Core MSCI World', ticker: 'IWDA', ter: 0.2, perf1y: 12.4, esg: 'AA', match: 94, zone: 'Monde', theme: 'Large cap' },
  { id: '2', name: 'Vanguard FTSE All-World', ticker: 'VWCE', ter: 0.22, perf1y: 11.8, esg: 'A', match: 91, zone: 'Monde', theme: 'Diversifié' },
  { id: '3', name: 'Amundi MSCI Europe ESG', ticker: 'CEU', ter: 0.18, perf1y: 8.2, esg: 'AAA', match: 88, zone: 'Europe', theme: 'ESG' },
  { id: '4', name: 'Xtrackers MSCI World ESG', ticker: 'XZWO', ter: 0.25, perf1y: 11.1, esg: 'AA', match: 86, zone: 'Monde', theme: 'ESG' },
  { id: '5', name: 'iShares Core MSCI EM IMI', ticker: 'EMIM', ter: 0.18, perf1y: 6.5, esg: 'A', match: 82, zone: 'Émergents', theme: 'Emerging' },
  { id: '6', name: 'SPDR MSCI World UCITS', ticker: 'SWRD', ter: 0.12, perf1y: 12.1, esg: 'A', match: 79, zone: 'Monde', theme: 'Large cap' },
  { id: '7', name: 'iShares MSCI USA ESG', ticker: 'SAUU', ter: 0.1, perf1y: 14.2, esg: 'AA', match: 77, zone: 'USA', theme: 'ESG' },
  { id: '8', name: 'Lyxor MSCI World Energy', ticker: 'DRIV', ter: 0.3, perf1y: -2.1, esg: 'B', match: 74, zone: 'Monde', theme: 'Sectoriel' },
]

function filterMock(etfs: EtfRow[], filters: FetchEtfsFilters): EtfRow[] {
  const ESG_ORDER = ['B', 'A', 'AA', 'AAA']
  const { zone, sector, esg, terMax } = filters

  return etfs.filter((etf) => {
    if (zone && zone !== 'Toutes' && etf.zone !== zone) return false
    if (sector && sector !== 'Tous' && etf.theme !== sector) return false
    if (esg && esg !== 'Tous') {
      const idxE = ESG_ORDER.indexOf(etf.esg)
      const idxS = ESG_ORDER.indexOf(esg)
      if (idxE === -1 || idxE < idxS) return false
    }
    if (terMax) {
      const m = terMax.match(/0[,.](\d+)/)
      const maxVal = m ? parseFloat(`0.${m[1]}`) : null
      if (maxVal !== null && etf.ter > maxVal) return false
    }
    return true
  })
}

/** Récupère les ETF (API ou mock). */
export async function fetchEtfs(filters: FetchEtfsFilters = {}): Promise<{ etfs: EtfRow[]; error: Error | null }> {
  if (isCustomApiConfigured()) {
    const params = new URLSearchParams()
    if (filters.zone) params.set('zone', filters.zone)
    if (filters.sector) params.set('sector', filters.sector)
    if (filters.esg) params.set('esg', filters.esg)
    if (filters.terMax) params.set('terMax', filters.terMax)
    const qs = params.toString() ? `?${params.toString()}` : ''
    const { data, error } = await api.get<{ etfs: EtfRow[] }>(`/api/etfs${qs}`)
    
    if (error) {
      console.warn('[etfService] API call failed, using mock data:', error)
      return { 
        etfs: filterMock(MOCK_ETFS, filters), 
        error: new Error(`Mode déconnecté: ${error.message} (Données simulées)`) 
      }
    }
    
    return { etfs: data?.etfs ?? [], error: null }
  }
  return { etfs: filterMock(MOCK_ETFS, filters), error: null }
}
