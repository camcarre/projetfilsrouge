import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto text-center py-12 px-4">
      <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Page introuvable</h1>
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400 mb-6">
        L’adresse demandée n’existe pas ou a été déplacée.
      </p>
      <Link to="/">
        <Button variant="primary">Retour à l’accueil</Button>
      </Link>
    </div>
  )
}
