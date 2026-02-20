import { useState } from 'preact/hooks'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const QUESTIONS: { q: string; options: string[]; correct: number }[] = [
  { q: 'Que signifie TER ?', options: ['Total Expense Ratio (frais annuels du fonds)', 'Taux d\'épargne recommandé', 'Titre émis en réduction'], correct: 0 },
  { q: 'Qu\'est-ce que le DCA ?', options: ['Un type d\'ETF', 'Investir régulièrement une même somme pour lisser le prix', 'Un indice boursier'], correct: 1 },
  { q: 'Le PEA a un plafond de souscription de :', options: ['75 000 €', '150 000 €', '225 000 €'], correct: 1 },
  { q: 'La réplication physique d\'un ETF signifie :', options: ['L\'ETF utilise des dérivés', 'L\'ETF détient les titres de l\'indice', 'L\'ETF ne réplique qu\'un échantillon'], correct: 1 },
  { q: 'La flat tax (PFU) sur les revenus du capital en France est de :', options: ['24 %', '30 %', '35 %'], correct: 1 },
]

export function QuizPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [done, setDone] = useState(false)

  const current = QUESTIONS[step]
  const score = answers.filter((a, i) => a === QUESTIONS[i].correct).length

  const handleAnswer = (idx: number) => {
    if (done) return
    const next = [...answers, idx]
    setAnswers(next)
    if (step + 1 >= QUESTIONS.length) setDone(true)
    else setStep(step + 1)
  }

  if (done)
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
        </div>
        <Card title="Résultat du quiz">
          <p className="text-[15px] text-neutral-700 dark:text-neutral-300 mb-2">
            Vous avez obtenu <strong>{score}</strong> / {QUESTIONS.length} bonne(s) réponse(s).
          </p>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4">
            {score >= QUESTIONS.length * 0.8 ? 'Bravo !' : score >= QUESTIONS.length * 0.5 ? 'Pas mal, révisez quelques notions.' : 'Révisez le glossaire et réessayez.'}
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => { setStep(0); setAnswers([]); setDone(false) }}>Recommencer</Button>
            <Link to="/education"><Button variant="secondary">Retour aux modules</Button></Link>
          </div>
        </Card>
      </div>
    )

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Quiz</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Question {step + 1} / {QUESTIONS.length}
      </p>
      <Card title={current.q}>
        <ul className="space-y-2">
          {current.options.map((opt, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => handleAnswer(idx)}
                className="w-full text-left px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 text-[13px] text-neutral-800 dark:text-neutral-200 transition-all duration-200"
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
