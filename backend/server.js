/**
 * Backend minimal – conforme au contrat API (docs/API_BACKEND_CUSTOM.md).
 * Auth + CRUD actifs. Données en mémoire (pour dev / démo).
 */
import express from 'express'
import cors from 'cors'
import db from './database.js'
import YahooFinance from 'yahoo-finance2'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Charger explicitement le .env à la racine
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Essayer plusieurs chemins pour le .env
dotenv.config({ path: path.resolve(__dirname, '../.env') })
if (!process.env.HF_API_TOKEN) {
    // Si lancé depuis backend/
    dotenv.config({ path: path.resolve(__dirname, '../../.env') })
}
if (!process.env.HF_API_TOKEN) {
    // Si le fichier s'appelle .env.local
    dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
}

const yahooFinance = new YahooFinance()

import { 
  getEtfs, 
  getEtfDetails, 
  getEtfHoldings, 
  getEtfPerformance, 
  getEtfsWithCache,
  validateTicker,
  formatEtfResponse
} from './services/yahooEtfService.js'

const app = express()
const PORT = process.env.PORT || 3000
const HF_API_TOKEN = process.env.HF_API_TOKEN

console.log('[DEBUG] Token HF présent ?', !!process.env.HF_API_TOKEN)
console.log('[DEBUG] Token length:', process.env.HF_API_TOKEN ? process.env.HF_API_TOKEN.length : 0)

app.use(cors({ origin: '*' }))
app.use(express.json())

// Middleware de log
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

function randomToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// --- Auth ---
app.post('/auth/register', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'email et password requis' })
  }
  
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' })
    }

    const info = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, password)
    const userId = info.lastInsertRowid
    const token = randomToken()
    
    db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId)
    
    res.status(200).json({ user: { id: userId, email }, token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'email et password requis' })
  }
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' })
  }
  
  const token = randomToken()
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, user.id)
  
  res.status(200).json({ user: { id: user.id, email: user.email }, token })
})

function getUserId(req) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token)
  return session ? session.user_id : null
}

app.get('/auth/me', (req, res) => {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ message: 'Non authentifié' })
  
  const user = db.prepare('SELECT id, email, display_name, knowledge_level FROM users WHERE id = ?').get(userId)
  if (!user) return res.status(401).json({ message: 'Session invalide' })
  
  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      knowledgeLevel: user.knowledge_level,
    },
  })
})

app.post('/auth/logout', (req, res) => {
  const auth = req.headers.authorization
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  }
  res.status(204).send()
})

// --- Actifs (protégés par token, authentification requise) ---
app.get('/api/assets', (req, res) => {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ message: 'Non authentifié' })
  
  const portfolioId = req.query.portfolioId
  let query = 'SELECT * FROM assets WHERE user_id = ?'
  const params = [userId]
  
  if (portfolioId) {
    query += ' AND portfolio_id = ?'
    params.push(portfolioId)
  }
  
  const assets = db.prepare(query).all(...params)
  const totalValue = assets.reduce((s, a) => s + a.quantity * a.unit_price, 0)
  
  res.status(200).json({
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      symbol: a.symbol,
      category: a.category,
      quantity: a.quantity,
      unitPrice: a.unit_price,
      currency: a.currency,
    })),
    totalValue,
  })
})

app.post('/api/assets', (req, res) => {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ message: 'Non authentifié' })
  
  const { portfolioId, name, symbol, category, quantity, unitPrice, currency } = req.body || {}
  if (!name || !symbol || category == null || quantity == null || unitPrice == null || !currency) {
    return res.status(400).json({ message: 'Champs requis: name, symbol, category, quantity, unitPrice, currency' })
  }

  const result = db.prepare(`
    INSERT INTO assets (user_id, portfolio_id, name, symbol, category, quantity, unit_price, currency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, portfolioId || 'default', name, symbol, category, Number(quantity), Number(unitPrice), currency)
  
  res.status(201).json({
    asset: {
      id: result.lastInsertRowid,
      name,
      symbol,
      category,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      currency,
    },
  })
})

app.put('/api/assets/:id', (req, res) => {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ message: 'Non authentifié' })
  
  const { name, symbol, category, quantity, unitPrice, currency } = req.body || {}
  const assetId = req.params.id
  
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId)
  if (!asset) return res.status(404).json({ message: 'Actif introuvable' })
  if (asset.user_id !== userId) return res.status(403).json({ message: 'Accès refusé' })
  
  const updates = []
  const params = []
  
  if (name !== undefined) { updates.push('name = ?'); params.push(name) }
  if (symbol !== undefined) { updates.push('symbol = ?'); params.push(symbol) }
  if (category !== undefined) { updates.push('category = ?'); params.push(category) }
  if (quantity !== undefined) { updates.push('quantity = ?'); params.push(Number(quantity)) }
  if (unitPrice !== undefined) { updates.push('unit_price = ?'); params.push(Number(unitPrice)) }
  if (currency !== undefined) { updates.push('currency = ?'); params.push(currency) }
  
  if (updates.length > 0) {
    params.push(assetId)
    db.prepare(`UPDATE assets SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params)
  }
  
  const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId)
  
  res.status(200).json({
    asset: {
      id: updated.id,
      name: updated.name,
      symbol: updated.symbol,
      category: updated.category,
      quantity: updated.quantity,
      unitPrice: updated.unit_price,
      currency: updated.currency,
    },
  })
})

app.delete('/api/assets/:id', (req, res) => {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ message: 'Non authentifié' })
  
  const assetId = req.params.id
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId)
  
  if (!asset) return res.status(404).json({ message: 'Actif introuvable' })
  if (asset.user_id !== userId) return res.status(403).json({ message: 'Accès refusé' })
  
  db.prepare('DELETE FROM assets WHERE id = ?').run(assetId)
  res.status(204).send()
})

// --- Prediction / Analyse (Réel avec Yahoo Finance) ---
app.get('/api/predict/stock', async (req, res) => {
  try {
    const { symbol } = req.query
    if (!symbol) return res.status(400).json({ message: 'Symbole requis' })
    
    // 1. Récupérer les données historiques réelles
    const details = await getEtfDetails(String(symbol))
    
    if (!details.historical || details.historical.length < 30) {
       // Fallback si pas assez de données
       return res.status(404).json({ message: 'Pas assez de données historiques pour ce symbole' })
    }

    // 2. Préparer les données pour la régression (60 derniers jours)
    const historyData = details.historical.slice(-60)
    const prices = historyData.map(h => h.close)
    const currentPrice = prices[prices.length - 1]

    // 3. Prédiction (IA ou Régression)
    let forecast = []
    let modelUsed = 'linear-regression'

    if (process.env.HF_API_TOKEN) {
      try {
        // Nouveau format pour le Router Hugging Face (OpenAI-compatible)
        const lastPrices = prices.slice(-15).map(p => Math.round(p)).join(', ')
        const prompt = `The stock prices for the last 15 days are: ${lastPrices}. Predict the next 5 prices as a simple comma-separated list of numbers only (e.g. 170, 172, 175, 178, 180).`
        
        console.log('[predict] Appel Hugging Face Router...', prompt)
        
        const modelId = 'mistralai/Mistral-7B-Instruct-v0.3'
        
        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.HF_API_TOKEN}`
          },
          method: 'POST',
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: 'You are a financial forecasting assistant. Always respond only with a list of 5 comma-separated numbers.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 50
          }),
        })

        if (!response.ok) {
           const errText = await response.text()
           throw new Error(`HF Router Error ${response.status}: ${errText}`)
        }

        const hfResult = await response.json()
        const generatedText = hfResult.choices?.[0]?.message?.content || ''
        console.log('[predict] Réponse IA:', generatedText)
        
        // Parser les nombres
        const numbers = generatedText.split(/[\s,]+/).map(s => parseFloat(s)).filter(n => !isNaN(n))
        
        if (numbers.length > 0) {
          // On prend les 5 premiers nombres trouvés
          forecast = numbers.slice(0, 5)
          modelUsed = modelId
        } else {
          throw new Error('Pas de nombres trouvés dans la réponse IA')
        }

      } catch (hfError) {
        console.warn('[predict] Fallback Régression car erreur HF:', hfError.message)
        // Fallback Régression
        const n = prices.length
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
        for (let i = 0; i < n; i++) {
          sumX += i
          sumY += prices[i]
          sumXY += i * prices[i]
          sumXX += i * i
        }
        const denominator = (n * sumXX - sumX * sumX)
        const slope = (n * sumXY - sumX * sumY) / denominator
        const intercept = (sumY - slope * sumX) / n
        let sumResidualsSq = 0
        for(let i=0; i<n; i++) {
            const predicted = slope * i + intercept
            const residual = prices[i] - predicted
            sumResidualsSq += residual * residual
        }
        const stdDev = Math.sqrt(sumResidualsSq / n)
        
        for (let i = 0; i < 30; i++) {
           const x = n + i
           let trend = slope * x + intercept
           const noise = (Math.random() - 0.5) * stdDev * 1.5 
           forecast.push(parseFloat((trend + noise).toFixed(2)))
        }
      }
    } else {
        // Pas de token -> Régression directe
        const n = prices.length
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
        for (let i = 0; i < n; i++) {
          sumX += i
          sumY += prices[i]
          sumXY += i * prices[i]
          sumXX += i * i
        }
        const denominator = (n * sumXX - sumX * sumX)
        const slope = (n * sumXY - sumX * sumY) / denominator
        const intercept = (sumY - slope * sumX) / n
        let sumResidualsSq = 0
        for(let i=0; i<n; i++) {
            const predicted = slope * i + intercept
            const residual = prices[i] - predicted
            sumResidualsSq += residual * residual
        }
        const stdDev = Math.sqrt(sumResidualsSq / n)
        
        for (let i = 0; i < 30; i++) {
           const x = n + i
           let trend = slope * x + intercept
           const noise = (Math.random() - 0.5) * stdDev * 1.5 
           forecast.push(parseFloat((trend + noise).toFixed(2)))
        }
    }

    res.json({
      symbol,
      prediction: {
        current_price: currentPrice,
        predicted_price: forecast[forecast.length - 1],
        forecast,
        history: prices, // Envoyer l'historique pour l'affichage
        confidence: modelUsed.includes('huggingface') ? 0.6 : 0.75, // Confiance indicative
        model: modelUsed
      }
    })

  } catch (err) {
    console.error('[predict]', err)
    res.status(500).json({ message: 'Erreur lors de la prédiction' })
  }
})

// --- ETF (données Yahoo Finance) ---
app.get('/api/etfs', async (req, res) => {
  try {
    const { zone, sector, esg, terMax } = req.query
    const filters = { zone, sector, esg, terMax }
    const etfs = await getEtfs(filters) // Maintenant avec prix et évolutions
    res.status(200).json({ etfs })
  } catch (err) {
    console.error('[etfs]', err)
    res.status(500).json({ message: 'Erreur lors du chargement des ETF' })
  }
})

// Détails d'un ETF spécifique
app.get('/api/etfs/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params
    
    if (!validateTicker(ticker)) {
      return res.status(400).json({ message: 'Ticker invalide' })
    }
    
    const details = await getEtfDetails(ticker)
    res.status(200).json({ details })
  } catch (err) {
    console.error('[etfs:details]', err)
    res.status(500).json({ message: 'Erreur lors du chargement des détails ETF' })
  }
})

// Performance d'un ETF
app.get('/api/etfs/:ticker/performance', async (req, res) => {
  try {
    const { ticker } = req.params
    const { period } = req.query // 1y, 6m, 3m, 1m
    
    if (!validateTicker(ticker)) {
      return res.status(400).json({ message: 'Ticker invalide' })
    }
    
    const performance = await getEtfPerformance(ticker, period)
    res.status(200).json({ performance })
  } catch (err) {
    console.error('[etfs:performance]', err)
    res.status(500).json({ message: 'Erreur lors du chargement de la performance' })
  }
})

// Holdings/composition d'un ETF
app.get('/api/etfs/:ticker/holdings', async (req, res) => {
  try {
    const { ticker } = req.params
    
    if (!validateTicker(ticker)) {
      return res.status(400).json({ message: 'Ticker invalide' })
    }
    
    const holdings = await getEtfHoldings(ticker)
    res.status(200).json({ holdings })
  } catch (err) {
    console.error('[etfs:holdings]', err)
    res.status(500).json({ message: 'Erreur lors du chargement des holdings' })
  }
})

// Comparaison entre plusieurs ETF
app.post('/api/etfs/compare', async (req, res) => {
  try {
    const { tickers } = req.body // ["EWLD.PA", "CW8.PA", ...]
    
    if (!tickers || !Array.isArray(tickers) || tickers.length < 2) {
      return res.status(400).json({ message: 'Au moins 2 tickers requis' })
    }
    
    // Valider tous les tickers
    for (const ticker of tickers) {
      if (!validateTicker(ticker)) {
        return res.status(400).json({ message: `Ticker invalide: ${ticker}` })
      }
    }
    
    const comparisons = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const basicInfo = await getEtfs({})
          const etf = basicInfo.find(e => e.ticker === ticker)
          if (!etf) return null
          
          const performance = await getEtfPerformance(ticker)
          const details = await getEtfDetails(ticker)
          
          return {
            ...etf,
            performance: performance?.performance || 0,
            volatility: performance?.volatility || 0,
            esgScore: details.esgScore || 0
          }
        } catch (error) {
          console.warn(`[compare] Erreur pour ${ticker}:`, error)
          return null
        }
      })
    )
    
    const validComparisons = comparisons.filter(c => c !== null)
    res.status(200).json({ comparisons: validComparisons })
  } catch (err) {
    console.error('[etfs:compare]', err)
    res.status(500).json({ message: 'Erreur lors de la comparaison' })
  }
})

// Données historiques d'un ETF (pour les graphiques)
app.get('/api/etfs/:ticker/history', async (req, res) => {
  try {
    const { ticker } = req.params
    const { period = '3mo' } = req.query // 1mo, 3mo, 6mo, 1y, 2y
    
    if (!validateTicker(ticker)) {
      return res.status(400).json({ message: 'Ticker invalide' })
    }

    const details = await getEtfDetails(ticker)
    
    if (!details.historical || details.historical.length === 0) {
      return res.status(404).json({ message: 'Données historiques non disponibles' })
    }

    // Formater les données pour le graphique
    const chartData = details.historical.map(item => ({
      date: item.date.toISOString().split('T')[0],
      value: parseFloat(item.close.toFixed(2)),
      volume: item.volume,
      open: parseFloat(item.open.toFixed(2)),
      high: parseFloat(item.high.toFixed(2)),
      low: parseFloat(item.low.toFixed(2))
    }))

    // Trier par date (du plus ancien au plus récent)
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    res.status(200).json({ 
      ticker,
      data: chartData,
      period,
      count: chartData.length
    })
  } catch (err) {
    console.error('[etfs:history]', err)
    res.status(500).json({ message: 'Erreur lors du chargement des données historiques' })
  }
})

// --- Démarrer ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Finance PWA sur http://localhost:${PORT}`)
})
