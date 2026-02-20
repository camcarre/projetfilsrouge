import { useState, useEffect } from 'preact/hooks'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { api } from '@/services/api/client'

type Question = { q: string; options: string[]; correct: number }

export function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [isAi, setIsAi] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadQuiz = async () => {
    setLoading(true)
    setError(null)
    setDone(false)
    setStep(0)
    setAnswers([])
    
    try {
      const { data, error: apiError } = await api.get<{ questions: Question[]; isFallback?: boolean }>('/api/quiz/generate')
      if (apiError) throw new Error(apiError.message)
      if (data && data.questions) {
        setQuestions(data.questions)
        setIsAi(!data.isFallback)
      }
    } catch (err) {
      setError('Impossible de générer le quiz. Réessayez plus tard.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuiz()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Spinner size="lg" />
        <p className="text-[14px] text-neutral-500 animate-pulse">L&apos;IA génère vos questions personnalisées...</p>
      </div>
    )
  }

  if (error || questions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error || 'Aucune question trouvée.'}</p>
        <Button onClick={loadQuiz}>Réessayer</Button>
      </div>
    )
  }

  const current = questions[step]
  const score = answers.filter((a, i) => a === questions[i].correct).length

  if (done)
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
        </div>
        <Card title="Résultat du quiz">
          <p className="text-[15px] text-neutral-700 dark:text-neutral-300 mb-2">
            Vous avez obtenu <strong>{score}</strong> / {questions.length} bonne(s) réponse(s).
          </p>
          <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mb-4">
            {score >= questions.length * 0.8 ? 'Bravo !' : score >= questions.length * 0.5 ? 'Pas mal, révisez quelques notions.' : 'Révisez le glossaire et réessayez.'}
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={loadQuiz}>Nouveau quiz (IA)</Button>
            <Link to="/education"><Button variant="secondary">Retour aux modules</Button></Link>
          </div>
        </Card>
      </div>
    )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link to="/education" className="text-[13px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">← Éducation</Link>
        {isAi && (
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200/50 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            GÉNÉRÉ PAR IA
          </span>
        )}
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-2">Quiz</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        Question {step + 1} / {questions.length}
      </p>
      <Card title={current.q}>
        <ul className="space-y-2">
          {current.options.map((opt, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => {
                   const next = [...answers, idx]
                   setAnswers(next)
                   if (step + 1 >= questions.length) setDone(true)
                   else setStep(step + 1)
                }}
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

