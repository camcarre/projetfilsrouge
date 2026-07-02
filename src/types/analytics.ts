export interface IndicatorsResponse {
  ticker: string
  period: string
  dates: string[]
  rsi: (number | null)[]
  macd_line: (number | null)[]
  macd_signal: (number | null)[]
  macd_histogram: (number | null)[]
  bollinger_upper: (number | null)[]
  bollinger_middle: (number | null)[]
  bollinger_lower: (number | null)[]
}

export interface RiskMetrics {
  ticker: string
  period: string
  var_95: number
  var_99: number
  max_drawdown: number
  volatility: number
  sharpe_ratio: number
}

export interface CorrelationMatrix {
  tickers: string[]
  matrix: number[][]
  period: string
}
