import { Card } from '@/components/ui/Card'

export function EtfPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Recommandations ETF
      </h1>
      <Card title="Moteur de recommandation">
        <p className="text-gray-600">
          Recommandations basées sur le profil. Filtres sectoriels, géographiques, ESG.
          Comparaison d&apos;ETF, analyse des frais et performances, score de correspondance.
        </p>
      </Card>
    </div>
  )
}
