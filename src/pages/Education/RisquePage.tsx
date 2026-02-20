import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SECTIONS = [
  { title: 'Volatilité', content: 'Mesure des variations de cours (écart-type des rendements). Plus un actif est volatil, plus le risque de perte à court terme est élevé, mais aussi le potentiel de gain. Les actions sont en général plus volatiles que les obligations.' },
  { title: 'Corrélation', content: 'Degré de liaison entre les rendements de deux actifs. Une corrélation faible ou négative permet de mieux diversifier : quand un actif baisse, l’autre peut compenser.' },
  { title: 'Nombre d’actifs', content: 'Diversifier avec plusieurs titres ou fonds limite le risque spécifique (lié à une entreprise ou un secteur). Au-delà d’une quinzaine de lignes bien réparties, le gain de diversification diminue.' },
  { title: 'Zone géographique', content: 'Répartir entre Europe, USA, émergents, etc. réduit le risque pays et change. Un portefeuille 100 % France est plus exposé aux chocs locaux.' },
  { title: 'Diversification sectorielle', content: 'Ne pas tout mettre dans un seul secteur (tech, énergie, santé…). Les cycles sectoriels diffèrent ; une répartition limite l’impact d’une crise ciblée.' },
]

export function RisquePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Risque & diversification</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Volatilité, corrélation, nombre d&apos;actifs, zones et secteurs.
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
