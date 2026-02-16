export type AssetCategory = 'action' | 'obligation' | 'etf' | 'crypto' | 'autre'

export interface Asset {
  id: string
  name: string
  symbol: string
  category: AssetCategory
  quantity: number
  unitPrice: number
  currency: string
}

export interface PortfolioSummary {
  totalValue: number
  assets: Asset[]
  performance?: number
  volatility?: number
}
