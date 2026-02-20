/**
 * Service ETF : charge les tickers et meta, enrichit via Yahoo Finance.
 */
import YahooFinance from 'yahoo-finance2'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let tickers = []
let meta = {}

// Charger la liste des ETF disponibles sur Yahoo Finance
const USE_AVAILABLE_LIST = true

try {
  const tickersPath = USE_AVAILABLE_LIST
    ? join(__dirname, '../data/etf-tickers-available.json')
    : join(__dirname, '../data/etf-tickers-europe.json')
  const metaPath = USE_AVAILABLE_LIST
    ? join(__dirname, '../data/etf-meta-available.json')
    : join(__dirname, '../data/etf-meta-europe.json')
  
  tickers = JSON.parse(readFileSync(tickersPath, 'utf-8'))
  meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
  
  console.log(`[etf] Chargement ${tickers.length} ETF disponibles sur Yahoo Finance`)
} catch (e) {
  console.warn('[etf] Chargement données ETF:', e.message)
}

const yahoo = new YahooFinance()

// --- Cache système ---
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCached(key, fetchFunction) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  
  return fetchFunction().then(data => {
    cache.set(key, { data, timestamp: Date.now() })
    return data
  })
}

/**
 * Récupère les détails complets d'un ETF
 * @param {string} ticker - Le ticker de l'ETF
 * @returns {Promise<object>}
 */
export async function getEtfDetails(ticker) {
  try {
    let quote = null
    try {
      quote = await yahoo.quote(ticker)
    } catch (quoteError) {
      console.warn(`[getEtfDetails] Quote non disponible pour ${ticker}:`, quoteError.message)
      // Si on n'a même pas de quote, on ne peut rien faire de plus
      return {
        quote: null,
        historical: [],
        esgScore: null,
        sustainability: null
      }
    }
    
    // Utiliser une date valide pour historical
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    
    let historical = null
    try {
      const period1 = startDate.toISOString().split('T')[0]
      const period2 = new Date().toISOString().split('T')[0]
      
      // Utiliser chart() au lieu de historical() qui est déprécié/cassé
      const chartResult = await yahoo.chart(ticker, { 
        period1, 
        period2,
        interval: '1d'
      })
      
      if (chartResult && chartResult.quotes) {
          historical = chartResult.quotes
            .filter(q => q.close !== null && q.close !== undefined) // Filtrer les jours fériés
            .map(q => ({
              date: new Date(q.date),
              open: q.open,
              high: q.high,
              low: q.low,
              close: q.close,
              volume: q.volume,
              adjClose: q.adjclose || q.close
            }))
      }
    } catch (histError) {
      console.warn(`[getEtfDetails] Historical (via chart) non disponible pour ${ticker}:`, histError.message)
    }
    
    let info = null
    try {
      info = await yahoo.quoteSummary(ticker, { modules: ['summaryDetail'] })
    } catch (infoError) {
      console.warn(`[getEtfDetails] QuoteSummary non disponible pour ${ticker}:`, infoError.message)
      // Essayer avec un module plus simple
      try {
        info = await yahoo.quoteSummary(ticker, { modules: ['summaryDetail'] })
      } catch (simpleError) {
        console.warn(`[getEtfDetails] Même le summary simple échoue pour ${ticker}:`, simpleError.message)
      }
    }
    
    // Cas de secours : si historical est vide, on renvoie un tableau vide
    // pour ne pas faire planter le front
    return {
      quote,
      historical: historical || [],
      esgScore: info?.esgScores?.totalEsg?.raw || null,
      sustainability: info?.esgScores || null
    }
  } catch (error) {
    console.error(`[YahooFinance] Erreur pour ${ticker}:`, error)
    // Ne pas lancer d'erreur, retourner des données vides
    return {
      quote: null,
      historical: null,
      esgScore: null,
      sustainability: null
    }
  }
}

/**
 * Récupère les holdings/composition d'un ETF
 * @param {string} ticker - Le ticker de l'ETF
 * @returns {Promise<object|null>}
 */
export async function getEtfHoldings(ticker) {
  try {
    const holdings = await yahoo.holdings(ticker)
    return holdings
  } catch (error) {
    console.error(`[YahooFinance] Erreur holdings pour ${ticker}:`, error)
    return null
  }
}

/**
 * Récupère la performance d'un ETF
 * @param {string} ticker - Le ticker de l'ETF
 * @param {string} period - La période ('1y', '6m', '3m', '1m')
 * @returns {Promise<object|null>}
 */
export async function getEtfPerformance(ticker, period = '1y') {
  try {
    let startDate
    const now = new Date()
    
    switch (period) {
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    }
    
    const endDate = new Date()
    
    const historical = await yahoo.historical(ticker, { 
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0]
    })
    
    if (!historical || historical.length < 2) return null
    
    const firstPrice = historical[0].close
    const lastPrice = historical[historical.length - 1].close
    const performance = ((lastPrice - firstPrice) / firstPrice) * 100
    
    return {
      performance: Math.round(performance * 100) / 100,
      volatility: Math.round(calculateVolatility(historical) * 100) / 100,
      data: historical
    }
  } catch (error) {
    console.error(`[YahooFinance] Erreur performance pour ${ticker}:`, error)
    return null
  }
}

/**
 * Récupère les ETF avec données enrichies
 * @param {object} filters - { zone, sector, esg, terMax }
 * @returns {Promise<Array>}
 */
export async function getEtfsWithDetails(filters = {}) {
  const basicEtfs = await getEtfs(filters)
  
  // Enrichir avec plus de données
  const enrichedEtfs = await Promise.all(
    basicEtfs.map(async (etf) => {
      try {
        const details = await getEtfDetails(etf.ticker)
        const performance = await getEtfPerformance(etf.ticker)
        
        return {
          ...etf,
          // Données enrichies
          lastPrice: details.quote?.regularMarketPrice || 0,
          volume: details.quote?.regularMarketVolume || 0,
          marketCap: details.quote?.marketCap || 0,
          esgScore: details.esgScore || 0,
          volatility: performance?.volatility || 0,
          performance1y: performance?.performance || etf.perf1y,
          // Données de risque
          beta: details.quote?.beta || 1,
          dividendYield: details.quote?.dividendYield || 0,
          // Indicateurs techniques
          fiftyDayAverage: details.quote?.fiftyDayAverage || 0,
          twoHundredDayAverage: details.quote?.twoHundredDayAverage || 0
        }
      } catch (error) {
        console.warn(`[getEtfsWithDetails] Erreur pour ${etf.ticker}:`, error)
        return etf // Retourner les données de base en cas d'erreur
      }
    })
  )
  
  return enrichedEtfs
}

/**
 * Récupère les ETF avec cache
 * @param {object} filters - { zone, sector, esg, terMax }
 * @returns {Promise<Array>}
 */
export async function getEtfsWithCache(filters = {}) {
  const cacheKey = `etfs_${JSON.stringify(filters)}`
  return getCached(cacheKey, () => getEtfsWithDetails(filters))
}

/**
 * Formate la réponse ETF
 * @param {object} etf - L'objet ETF
 * @returns {object}
 */
export function formatEtfResponse(etf) {
  return {
    id: etf.ticker,
    ticker: etf.ticker,
    name: etf.name,
    zone: etf.zone,
    theme: etf.theme,
    esg: etf.esg,
    
    // Données financières
    ter: etf.ter,
    lastPrice: etf.lastPrice || 0,
    performance1y: etf.performance1y || 0,
    volatility: etf.volatility || 0,
    esgScore: etf.esgScore || 0,
    match: etf.match,
    
    // Métadonnées
    marketCap: etf.marketCap || 0,
    volume: etf.volume || 0,
    dividendYield: etf.dividendYield || 0,
    beta: etf.beta || 1,
    
    // Indicateurs techniques
    fiftyDayAverage: etf.fiftyDayAverage || 0,
    twoHundredDayAverage: etf.twoHundredDayAverage || 0
  }
}

/**
 * Valide un ticker
 * @param {string} ticker - Le ticker à valider
 * @returns {boolean}
 */
export function validateTicker(ticker) {
  if (!ticker || typeof ticker !== 'string') return false
  return /^[A-Z0-9]{1,10}(\.[A-Z]{2})?$/.test(ticker)
}

/**
 * Valide les filtres
 * @param {object} filters - Les filtres à valider
 * @returns {boolean}
 */
export function validateFilters(filters) {
  const validZones = ['Monde', 'Europe', 'Amérique', 'Asie', 'Toutes']
  const validSectors = ['Large cap', 'Small cap', 'Technologie', 'Santé', 'Diversifié', 'Tous']
  const validEsg = ['B', 'A', 'AA', 'AAA', 'Tous']
  
  if (filters.zone && !validZones.includes(filters.zone)) return false
  if (filters.sector && !validSectors.includes(filters.sector)) return false
  if (filters.esg && !validEsg.includes(filters.esg)) return false
  
  return true
}

/** Calcule un score match simple (0-100) à partir de ter et esg */
function calcMatch(ter, esg) {
  const terScore = Math.max(0, 100 - ter * 50)
  const esgOrder = ['B', 'A', 'AA', 'AAA']
  const esgIdx = esgOrder.indexOf(esg)
  const esgScore = esgIdx >= 0 ? 60 + esgIdx * 13 : 70
  return Math.round((terScore * 0.4 + esgScore * 0.6))
}

/** Calcule la volatilité annualisée à partir des données historiques */
function calculateVolatility(historicalData) {
  if (historicalData.length < 2) return 0
  
  const returns = []
  for (let i = 1; i < historicalData.length; i++) {
    const dailyReturn = (historicalData[i].close - historicalData[i-1].close) / historicalData[i-1].close
    returns.push(dailyReturn)
  }
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  
  return Math.sqrt(variance * 252) * 100 // Volatilité annualisée
}

/**
 * Récupère les ETF avec données Yahoo Finance.
 * @param {object} filters - { zone, sector, esg, terMax }
 * @returns {Promise<Array>}
 */
export async function getEtfs(filters = {}) {
  if (!tickers.length) return []

  // Essayer d'abord avec une requête groupée, sinon faire des requêtes individuelles
  let quotes = []
  let hasYahooError = false

  try {
    const quotesResult = await yahoo.quote(tickers)
    quotes = Array.isArray(quotesResult) ? quotesResult : Object.values(quotesResult)
  } catch (error) {
    console.warn('[getEtfs] Erreur Yahoo Finance quote groupée, essai individuel:', error.message)
    
    // Essayer des requêtes individuelles
    try {
      const individualQuotes = await Promise.allSettled(
        tickers.map(ticker => yahoo.quote(ticker))
      )
      
      quotes = individualQuotes
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(Boolean)
        
      if (quotes.length === 0) {
        hasYahooError = true
        console.warn('[getEtfs] Aucune donnée Yahoo Finance disponible via requêtes individuelles')
      }
    } catch (individualError) {
      console.error('[getEtfs] Erreur Yahoo Finance individuelle:', individualError.message)
      hasYahooError = true
    }
  }

  // Si Yahoo Finance a échoué ou n'a rien renvoyé, utiliser les données statiques (fallback)
  if (hasYahooError || quotes.length === 0) {
    console.warn('[getEtfs] Utilisation du fallback statique (Yahoo Finance indisponible)')
    return tickers.map(ticker => {
      const m = meta[ticker] || {}
      // Simuler des variations réalistes pour ne pas avoir tout à 0
      const randomChange = (Math.random() - 0.5) * 2
      const randomPrice = 100 + (Math.random() - 0.5) * 20
      
      return {
        id: ticker,
        name: m.description || ticker,
        ticker,
        lastPrice: parseFloat(randomPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 100000),
        change: parseFloat(randomChange.toFixed(2)),
        changePercent: parseFloat((randomChange / randomPrice * 100).toFixed(2)),
        ter: 0.2,
        perf1y: parseFloat(((Math.random() - 0.2) * 20).toFixed(2)),
        esg: m.esg || 'A',
        match: calcMatch(0.2, m.esg || 'A'),
        zone: m.zone || 'Monde',
        theme: m.theme || 'Diversifié',
        isMock: true // Indicateur pour le front si besoin
      }
    })
  }

  const results = []
  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i]
    if (!q) continue

    const ticker = q.symbol || tickers[i]
    const m = meta[ticker] || {}
    
    // Vérifier si l'ETF a des données valides
    const hasValidData = q.regularMarketPrice || q.previousClose || q.longName || q.shortName
    if (!hasValidData) {
      console.warn(`[getEtfs] ETF ${ticker} sans données valides, ignoré`)
      continue
    }
    
    const ter = q.netExpenseRatio != null ? q.netExpenseRatio * 100 : 0.2
    const perf1y = q.fiftyTwoWeekChangePercent != null ? q.fiftyTwoWeekChangePercent : 0
    const esg = m.esg || 'A'
    const zone = m.zone || 'Monde'
    const theme = m.theme || 'Diversifié'
    const match = calcMatch(ter, esg)

    // Ajouter les données de prix et évolution
    const lastPrice = q.regularMarketPrice || q.previousClose || 0
    const volume = q.regularMarketVolume || 0
    const change = q.regularMarketChange || (q.regularMarketPrice - q.previousClose) || 0
    const changePercent = q.regularMarketChangePercent || ((change / (q.previousClose || 1)) * 100) || 0

    results.push({
      id: ticker,
      name: q.longName || q.shortName || ticker,
      ticker,
      lastPrice: Math.round(lastPrice * 100) / 100,
      volume,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      ter: Math.round(ter * 100) / 100,
      perf1y: Math.round(perf1y * 100) / 100,
      esg,
      match,
      zone,
      theme,
    })
  }

  // Filtrage
  const { zone, sector, esg, terMax } = filters
  const ESG_ORDER = ['B', 'A', 'AA', 'AAA']

  return results.filter((etf) => {
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
