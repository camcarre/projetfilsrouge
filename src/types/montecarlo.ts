export interface MonteCarloStep {
  day: number
  p5: number
  p25: number
  p50: number
  p75: number
  p95: number
}

export interface MonteCarloResult {
  initialValue: number
  days: number
  simulations: number
  steps: MonteCarloStep[]
  var95: number
  var95Pct: number
}
