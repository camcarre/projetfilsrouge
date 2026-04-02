import { Routes, Route, Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { GlossaryPage } from '@/pages/Education/GlossaryPage'
import { QuizPage } from '@/pages/Education/QuizPage'
import { CalculatorsPage } from '@/pages/Education/CalculatorsPage'
import { FiscalitePage } from '@/pages/Education/FiscalitePage'
import { GuidesPage } from '@/pages/Education/GuidesPage'
import { VideosPage } from '@/pages/Education/VideosPage'
import { LexiquePage } from '@/pages/Education/LexiquePage'
import { RisquePage } from '@/pages/Education/RisquePage'

const MODULES: { title: string; desc: string; cta: string; to?: string }[] = [
  { title: 'Glossaire', desc: 'Définitions des termes financiers : TER, trackeur, réplication physique, dividend yield, P/E, capitalisation boursière.', cta: 'Parcourir', to: '/education/glossary' },
  { title: 'Guides d\'investissement', desc: 'Débuter en Bourse, DCA (dollar cost averaging), répartition d\'actifs, fonds d\'urgence.', cta: 'Lire', to: '/education/guides' },
  { title: 'Quiz', desc: 'Questions à choix multiples pour valider vos connaissances (niveau débutant à avancé).', cta: 'Commencer', to: '/education/quiz' },
  { title: 'Vidéos', desc: 'Cours courts et tutoriels : lire un graphique, comprendre un OPCVM, frais et impact long terme.', cta: 'Voir', to: '/education/videos' },
  { title: 'Calculatrices', desc: 'Intérêts composés, simulation DCA, objectif retraite, impact des frais sur la performance.', cta: 'Calculer', to: '/education/calculators' },
  { title: 'Lexique boursier', desc: 'Ordres (au marché, limité), liquidité, spread, horaires de cotation, types d\'ETF (distribuant / capitalisant).', cta: 'Consulter', to: '/education/lexique' },
  { title: 'Risque & diversification', desc: 'Volatilité, corrélation, nombre d\'actifs, zone géographique et sectorielle.', cta: 'Découvrir', to: '/education/risque' },
  { title: 'Fiscalité', desc: 'Compte-titres, PEA, assurance-vie, prélèvement forfaitaire, flat tax, report des moins-values.', cta: 'En savoir plus', to: '/education/fiscalite' },
]

function EducationHome() {
  return (
    <>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">
        Éducation financière
      </h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Glossaire, guides, quiz et outils pour mieux investir.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODULES.map(({ title, desc, cta, to }) => (
          <Card key={title} title={title}>
            <p className="text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
              {desc}
            </p>
            {to ? (
              <Link to={to}><Button variant="outline">{cta}</Button></Link>
            ) : (
              <Button variant="outline" disabled>{cta} (à venir)</Button>
            )}
          </Card>
        ))}
      </div>
    </>
  )
}

export function EducationPage() {
  return (
    <div>
      <Routes>
        <Route index element={<EducationHome />} />
        <Route path="glossary" element={<GlossaryPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="calculators" element={<CalculatorsPage />} />
        <Route path="fiscalite" element={<FiscalitePage />} />
        <Route path="guides" element={<GuidesPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="lexique" element={<LexiquePage />} />
        <Route path="risque" element={<RisquePage />} />
      </Routes>
    </div>
  )
}
