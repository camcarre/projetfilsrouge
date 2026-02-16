import { Card } from '@/components/ui/Card'

export function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Tableau de bord
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Vue d'ensemble">
          <p className="text-gray-600">
            Indicateurs clés, performance et diversification à venir.
          </p>
        </Card>
        <Card title="Performance">
          <p className="text-gray-600">
            Graphiques de performance du portefeuille.
          </p>
        </Card>
        <Card title="Alertes">
          <p className="text-gray-600">
            Notifications et alertes personnalisables.
          </p>
        </Card>
      </div>
    </div>
  )
}
