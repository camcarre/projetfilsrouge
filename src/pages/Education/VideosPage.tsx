import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const SECTIONS = [
  { title: 'Lire un graphique', content: 'Support et résistance, tendance, chandeliers. Comprendre les axes, les volumes et les indicateurs de base pour interpréter l’évolution d’un titre.' },
  { title: 'Comprendre un OPCVM', content: 'Fonds communs de placement : valeur liquidative, frais de gestion, réplication physique ou synthétique. Différence avec les ETF.' },
  { title: 'Frais et impact long terme', content: 'L’impact des frais de gestion et des frais d’entrée sur la performance à 10 ou 20 ans. Pourquoi les ETF à faible TER sont souvent privilégiés pour le long terme.' },
]

export function VideosPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Vidéos</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Cours courts et tutoriels : graphiques, OPCVM, frais et performance.
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
      <p className="text-[12px] text-neutral-500 dark:text-neutral-500 mt-4">
        Les vidéos seront intégrées prochainement (liens YouTube ou hébergement propre).
      </p>
      <div className="mt-4">
        <Link to="/education"><Button variant="secondary">Retour aux modules</Button></Link>
      </div>
    </div>
  )
}
