import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SECTIONS = [
  { title: 'Ordre au marché', content: 'Ordre d’achat ou de vente exécuté immédiatement au meilleur prix disponible. Rapide mais le prix peut varier légèrement selon la liquidité.' },
  { title: 'Ordre limité', content: 'Ordre exécuté uniquement si le cours atteint le prix que vous fixez (ou meilleur). Permet de contrôler le prix mais l’ordre peut ne jamais être exécuté.' },
  { title: 'Liquidité', content: 'Facilité à acheter ou vendre un titre sans faire bouger le prix. Plus le volume échangé est élevé, plus la liquidité est généralement bonne.' },
  { title: 'Spread', content: 'Écart entre le prix d’achat (ask) et le prix de vente (bid). Plus le spread est faible, moins le coût implicite de la transaction est élevé.' },
  { title: 'Horaires de cotation', content: 'En Europe (Euronext), séance continue généralement de 9h à 17h30. Pré-ouverture et après-clôture existent selon les places.' },
  { title: 'ETF distribuant / capitalisant', content: 'Distribuant : les dividendes sont versés aux porteurs. Capitalisant : les dividendes sont réinvestis dans le fonds, ce qui peut être plus intéressant fiscalement en PEA pour un horizon long terme.' },
]

export function LexiquePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Lexique boursier</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Ordres, liquidité, spread, horaires, types d&apos;ETF.
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
