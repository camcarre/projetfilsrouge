export type AlertScope = 'asset' | 'portfolio'
export type AlertMetric = 'day_change' | 'vs_pru'
export type AlertDirection = 'below' | 'above'

export interface AlertRule {
  id: number
  scope: AlertScope
  symbol: string | null
  metric: AlertMetric
  direction: AlertDirection
  threshold: number
  enabled: number
}

export interface NewAlertRule {
  scope: AlertScope
  symbol?: string | null
  metric: AlertMetric
  direction: AlertDirection
  threshold: number
}

export interface AppNotification {
  id: number
  message: string
  read: number
  created_at: string
}
