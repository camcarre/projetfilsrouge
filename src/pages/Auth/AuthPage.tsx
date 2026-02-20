import { useState } from 'preact/hooks'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { setUser } from '@/store/slices/authSlice'
import { signInWithEmail, signUpWithEmail } from '@/services/authService'
import { isCustomApiConfigured } from '@/services/api/client'

export function AuthPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password)
      if (result.error) {
        const msg = result.error.message
        setError(
          /réseau|fetch|failed to fetch|network/i.test(msg)
            ? 'Impossible de joindre le backend. Vérifie que le serveur tourne (npm run dev:all depuis projetfilsrouge) et que VITE_API_URL=http://localhost:3000 dans .env.'
            : msg
        )
        return
      }
      if (result.user) {
        dispatch(setUser(result.user))
        navigate('/', { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3.5 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400/60 focus:border-neutral-400 dark:focus:ring-neutral-500/60 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 ease-out'

  return (
    <div className="max-w-sm mx-auto pt-1">
      <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 tracking-tight mb-5">
        {isSignUp ? 'Inscription' : 'Connexion'}
      </h1>
      <Card>
        {!isCustomApiConfigured() && (
          <Alert variant="warning" className="mb-3" role="status">
            Backend non configuré. Crée un fichier .env avec VITE_API_URL=http://localhost:3000 puis lance le back.
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-[12px] font-medium text-neutral-500 dark:text-neutral-500 mb-1.5 tracking-tight">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
              required
              autoComplete="email"
              aria-invalid={!!error}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[12px] font-medium text-neutral-500 dark:text-neutral-500 mb-1.5 tracking-tight">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              aria-invalid={!!error}
              aria-describedby={error ? 'auth-error' : undefined}
              className={inputClass}
            />
          </div>
          {error && (
            <Alert variant="error" id="auth-error">
              {error}
            </Alert>
          )}
          <div className="flex gap-2 pt-0.5">
            <Button type="submit" variant="primary" disabled={loading} aria-busy={loading}>
              {loading ? <Spinner size="sm" /> : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
            >
              {isSignUp ? 'Déjà un compte ?' : 'Créer un compte'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
