import { Card } from '@/components/ui/Card'

export function PortfolioPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Gestion du portefeuille
      </h1>
      <Card title="Actifs">
        <p className="text-gray-600">
          Ajout, modification et suppression d&apos;actifs. Catégorisation (actions, obligations, ETF, crypto).
          Saisie manuelle des transactions et calcul des performances.
        </p>
      </Card>
    </div>
  )
}
