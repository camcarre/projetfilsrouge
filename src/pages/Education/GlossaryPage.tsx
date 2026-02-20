import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const TERMS: { term: string; definition: string }[] = [
  { term: 'TER', definition: 'Total Expense Ratio : frais annuels de gestion d\'un fonds (gestion, garde, etc.), exprimés en % de l\'actif.' },
  { term: 'Trackeur', definition: 'Fonds (souvent ETF) qui réplique un indice (ex. MSCI World) pour en suivre la performance.' },
  { term: 'Réplication physique', definition: 'L\'ETF détient les titres de l\'indice. Réplication synthétique : utilisation de dérivés pour reproduire l\'indice.' },
  { term: 'Dividend yield', definition: 'Rendement du dividende : dividende annuel / cours de l\'action, en %.' },
  { term: 'P/E (Price/Earnings)', definition: 'Ratio cours / bénéfice par action. Mesure de valorisation : plus il est bas, plus l\'action peut être considérée comme « bon marché » (relativement).' },
  { term: 'Capitalisation boursière', definition: 'Valeur de marché d\'une entreprise = nombre d\'actions × cours de l\'action.' },
  { term: 'DCA (Dollar Cost Averaging)', definition: 'Investir régulièrement une même somme pour lisser le prix d\'achat et réduire l\'impact de la volatilité.' },
  { term: 'OPCVM', definition: 'Organisme de placement collectif en valeurs mobilières : SICAV, FCP (fonds communs de placement).' },
  { term: 'PEA', definition: 'Plan d\'épargne en actions : enveloppe fiscale française, plafond 150 000 €, avantages fiscaux sous conditions.' },
  { term: 'Flat tax', definition: 'Prélèvement forfaitaire unique (PFU) de 30 % sur les revenus du capital (12,8 % IR + 17,2 % prélèvements sociaux).' },
]

export function GlossaryPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Glossaire</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Définitions des termes financiers courants.
      </p>
      <Card>
        <ul className="space-y-4">
          {TERMS.map(({ term, definition }) => (
            <li key={term} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0 pb-4 last:pb-0">
              <p className="font-semibold text-neutral-800 dark:text-neutral-100 text-[14px]">{term}</p>
              <p className="text-[13px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">{definition}</p>
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
