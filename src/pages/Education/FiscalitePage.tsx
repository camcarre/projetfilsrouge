import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SECTIONS = [
  {
    title: 'Compte-titres ordinaire',
    content: 'Compte d’ordre (pas d’avantage fiscal). Plus-values et dividendes imposables chaque année. Idéal pour des montants déjà fiscalisés ou pour une grande liberté de mouvement.',
  },
  {
    title: 'PEA (Plan d’épargne en actions)',
    content: 'Enveloppe fiscale française, plafond de versement 150 000 €. Après 5 ans, sortie en capital possible sans impôt sur le revenu (uniquement prélèvements sociaux, sauf exonération PEA-PME). Les plus-values restent exonérées d’IR. À privilégier pour un investissement long terme en actions/ETF européens.',
  },
  {
    title: 'Assurance-vie',
    content: 'Contrat en unités de compte (fonds, ETF) ou en fonds euros. Fiscalité au déblocage : option pour le prélèvement forfaitaire unique (PFU) ou barème de l’IR. Existence d’abattements pour durée de détention. Très utilisé pour la diversification et la transmission.',
  },
  {
    title: 'Prélèvement forfaitaire unique (PFU / flat tax)',
    content: '30 % (12,8 % IR + 17,2 % prélèvements sociaux) sur les revenus du capital (dividendes, intérêts, plus-values). Option possible à la place du barème progressif de l’IR. À comparer selon votre TMI.',
  },
  {
    title: 'Report des moins-values',
    content: 'Les moins-values réalisées sur un compte-titres peuvent être reportées sur les plus-values des 10 années suivantes. Elles ne s’imputent pas sur le revenu global, uniquement sur les plus-values de valeurs mobilières.',
  },
]

export function FiscalitePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Fiscalité</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Compte-titres, PEA, assurance-vie, prélèvement forfaitaire, report des moins-values.
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
