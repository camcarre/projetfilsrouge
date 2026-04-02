import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

const GUIDES = [
  {
    title: "Commencer avec le DCA (Dollar Cost Averaging)",
    content: "Le DCA consiste à investir une somme fixe (ex: 100 €) tous les mois, quel que soit le prix du marché. Cette méthode permet de lisser votre prix d'achat moyen et de réduire l'impact de la volatilité sur vos investissements sur le long terme.",
  },
  {
    title: "Comprendre les intérêts composés",
    content: "Les intérêts composés sont les intérêts sur les intérêts. En réinvestissant vos gains, votre capital croît de façon exponentielle au fil du temps. C'est l'un des piliers les plus puissants de la richesse sur le long terme.",
  },
  {
    title: "Répartition d'actifs (Asset Allocation)",
    content: "Une bonne diversification consiste à répartir votre capital entre différentes classes d'actifs (actions, obligations, immobilier, crypto). Cela permet de limiter le risque : si une partie de vos investissements baisse, les autres peuvent compenser.",
  },
  {
    title: "Qu'est-ce qu'un ETF ?",
    content: "Un ETF (Exchange Traded Fund) est un panier d'actions qui réplique la performance d'un indice (ex: CAC 40). C'est un moyen simple et peu coûteux (TER bas) d'investir dans des centaines d'entreprises d'un coup.",
  },
  {
    title: "Le Fonds d'Urgence",
    content: "Avant de commencer à investir en bourse, il est essentiel d'avoir un fonds d'urgence de 3 à 6 mois de dépenses courantes sur un livret sécurisé (ex: Livret A). Cela évite de devoir vendre vos actions lors d'une baisse du marché pour payer une dépense imprévue.",
  },
]

export function GuidesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Guides d'investissement</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Apprendre les bases pour construire une stratégie solide.
      </p>
      
      <div className="space-y-4">
        {GUIDES.map(({ title, content }) => (
          <Card key={title} title={title}>
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {content}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
