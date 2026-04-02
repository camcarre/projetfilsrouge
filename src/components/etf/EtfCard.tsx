import { useState, useEffect } from 'preact/hooks'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CombinedChart } from '@/components/ui/CombinedChart'
import { fetchEtfHistory, formatHistoryForChart } from '@/services/etfHistoryService'
import type { EtfRow } from '@/services/etfService'

interface EtfCardProps {
  etf: EtfRow
  onSelect: (etf: EtfRow) => void
  onCompare: (etf: EtfRow) => void
  isComparing?: boolean
}

interface ChartData {
  date: string
  value: number
}

export function EtfCard({ etf, onSelect, onCompare, isComparing }: EtfCardProps) {


  const [chartData, setChartData] = useState<ChartData[]>([])

  useEffect(() => {
    // Récupérer les vraies données historiques depuis Yahoo Finance
    const fetchHistory = async () => {
      try {
        const historyData = await fetchEtfHistory(etf.ticker, '1mo')
        const formattedData = formatHistoryForChart(historyData)
        setChartData(formattedData)
      } catch (error) {
        console.error(`[EtfCard] Erreur pour ${etf.ticker}:`, error)
        // Fallback: données mock en cas d'erreur
        const data: ChartData[] = []
        const baseValue = 100
        const volatility = Math.abs(etf.perf1y || 0) / 100
        
        for (let i = 30; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const randomChange = (Math.random() - 0.5) * volatility * 0.1
          const value = baseValue * (1 + randomChange)
          
          data.push({
            date: date.toISOString().split('T')[0],
            value: parseFloat(value.toFixed(2))
          })
        }
        setChartData(data)
      }
    }

    fetchHistory()
  }, [etf])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getPerformanceColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPerformanceBg = (value: number) => {
    if (value > 0) return 'bg-green-100 text-green-800'
    if (value < 0) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className={`p-4 hover:shadow-lg transition-all duration-300 ${isComparing ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
              {etf.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{etf.ticker}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(100)}
            </div>
            <div className={`text-sm font-medium ${getPerformanceColor(etf.perf1y || 0)}`}>
              {formatPercent(etf.perf1y || 0)}
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-gray-500">TER</div>
            <div className="font-semibold">{(etf.ter || 0).toFixed(2)}%</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-gray-500">1 an</div>
            <div className={`font-semibold ${getPerformanceColor(etf.perf1y || 0)}`}>
              {formatPercent(etf.perf1y || 0)}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-gray-500">ESG</div>
            <div className="font-semibold">{etf.esg}</div>
          </div>
        </div>

        {/* Graphique */}
        <div className="h-32">
          <CombinedChart 
            historical={chartData.map(d => d.value)}
            height={120}
            minimal={true}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onSelect(etf)}
            className="flex-1 text-sm"
            variant="primary"
          >
            Détails
          </Button>
          <Button 
            onClick={() => onCompare(etf)}
            className="text-sm"
            variant={isComparing ? "secondary" : "outline"}
          >
            {isComparing ? '✓' : 'Comparer'}
          </Button>
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {etf.zone}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
            {etf.theme}
          </span>
          <span className={`px-2 py-1 text-xs rounded ${getPerformanceBg(etf.match || 0)}`}>
            Match: {etf.match}%
          </span>
        </div>
      </div>
    </Card>
  )
}