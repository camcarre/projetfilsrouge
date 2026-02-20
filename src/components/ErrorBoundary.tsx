import { Component } from 'preact'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

interface Props {
  children: import('preact').ComponentChildren
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="max-w-md">
            <h1 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
              Une erreur est survenue
            </h1>
            <p className="text-[14px] text-neutral-600 dark:text-neutral-400 mb-6">
              L&apos;application a rencontré un problème. Vous pouvez réessayer ou retourner à l&apos;accueil.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Réessayer
              </Button>
              <Link to="/">
                <Button variant="secondary">Retour à l&apos;accueil</Button>
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
