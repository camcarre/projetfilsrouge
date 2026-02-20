import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SECTIONS = [
  { title: 'Débuter en Bourse', content: 'Comprendre les bases : actions, ordres, horaires de cotation. Choisir un courtier, ouvrir un PEA ou un compte-titres, et passer vos premiers ordres en connaissance de cause.' },
  { title: 'DCA (Dollar Cost Averaging)', content: 'Investir régulièrement un même montant pour lisser le prix d’achat et réduire l’impact de la volatilité. Idéal pour un objectif long terme sans devoir timer le marché.' },
  { title: 'Répartition d’actifs', content: 'Répartir son portefeuille entre actions, obligations et éventuellement monétaire selon son profil de risque et son horizon. Rééquilibrer périodiquement pour garder les proportions cibles.' },
  { title: 'Fonds d’urgence', content: 'Constituer une réserve de liquidités (3 à 6 mois de dépenses) avant d’investir en Bourse. À placer sur livret ou compte à terme pour un accès rapide sans risque de perte en capital.' },
]

export function GuidesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Guides d&apos;investissement</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Débuter en Bourse, DCA, répartition d&apos;actifs, fonds d&apos;urgence.
      </p>
      <Card>
        <ul className="space-y-5">
          {SECTIONS.map(({ title, content }) => (
            <li key={title} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 pb-5 last:pb-0">
              <h2 className="font-semibold text-neutral-800 dark:text-neutral-100 text-[14px] mb-2">{title}</h2>
              <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed">{content}</p>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-4">
        <Link to="/education"><Button variant="secondary">Retour aux modules</Button></Link>
      </div>
    </div>
  )
}
