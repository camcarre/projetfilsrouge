import { Card } from '@/components/ui/Card'

export function AnalysisPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Analyse et visualisation
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Graphiques interactifs">
          <p className="text-gray-600">
            Courbes, camemberts, histogrammes. Corrélation entre actifs.
          </p>
        </Card>
        <Card title="Risque">
          <p className="text-gray-600">
            VaR, volatilité, drawdown. Benchmarking et simulations (Monte Carlo).
          </p>
        </Card>
      </div>
    </div>
  )
}
