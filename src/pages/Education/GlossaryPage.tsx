import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

const TERMS = [
  { term: 'Action', def: 'Titre de propriété représentant une fraction du capital d\'une entreprise. Donne droit à une part des bénéfices (dividendes) et au vote.' },
  { term: 'ETF (Exchange Traded Fund)', def: 'Fonds d\'investissement qui réplique la performance d\'un indice (comme le CAC 40 ou le S&P 500) et s\'échange en bourse comme une action.' },
  { term: 'DCA (Dollar Cost Averaging)', def: 'Stratégie consistant à investir une somme fixe à intervalles réguliers, quel que soit le prix du marché, pour lisser le prix d\'achat moyen.' },
  { term: 'TER (Total Expense Ratio)', def: 'Frais de gestion annuels totaux prélevés par le gestionnaire d\'un fonds ou d\'un ETF. Plus il est bas, plus la performance nette est élevée.' },
  { term: 'Dividende', def: 'Partie du bénéfice d\'une entreprise distribuée aux actionnaires.' },
  { term: 'P/E Ratio (Price-to-Earnings)', def: 'Indicateur de valorisation calculé en divisant le cours de l\'action par le bénéfice net par action. Un P/E élevé peut indiquer une survalorisation ou une forte croissance attendue.' },
  { term: 'Capitalisation boursière', def: 'Valeur totale d\'une entreprise en bourse, calculée en multipliant le nombre d\'actions en circulation par le cours actuel.' },
  { term: 'Volatility', def: 'Mesure de l\'ampleur des variations du cours d\'un actif. Une volatilité élevée signifie un risque plus important à court terme.' },
  { term: 'Diversification', def: 'Répartition des investissements sur différents types d\'actifs, zones géographiques ou secteurs pour réduire le risque global.' },
  { term: 'PEA (Plan d\'Épargne en Actions)', def: 'Enveloppe fiscale française permettant d\'investir en actions européennes avec une exonération d\'impôt sur le revenu après 5 ans.' },
]

export function GlossaryPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Glossaire financier</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Comprendre les termes essentiels de l&apos;investissement.
      </p>
      
      <div className="space-y-4">
        {TERMS.map(({ term, def }) => (
          <Card key={term} title={term}>
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {def}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
