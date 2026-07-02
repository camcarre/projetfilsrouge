export interface Backtest {
  horizon: number;
  train_size: number;
  test_size: number;
  rmse: number;
  mae: number;
  r2: number;
  model: string;
}

export interface Prediction {
  current_price: number;
  predicted_price: number;
  forecast: number[];
  history: number[];
  confidence: number;
  model: string;
  backtest?: Backtest | null;
}
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

export interface MatchBreakdown {
  risk: number
  horizon: number
  esg: number
  ter: number
  goal: number
}

export interface RecommendedEtfRow {
  id: string
  name: string
  ticker: string
  ter: number
  perf1y: number
  esg: string
  match: number
  zone: string
  theme: string
  match_score?: number
  match_breakdown?: MatchBreakdown
}

export interface CorrelationMatrix {
  tickers: string[]
  matrix: number[][]
  period: string
}
