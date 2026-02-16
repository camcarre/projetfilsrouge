import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function AuthPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Connexion / Inscription
      </h1>
      <Card>
        <p className="text-gray-600 mb-4">
          Inscription et connexion (email, Google, Apple) à implémenter avec Supabase Auth.
        </p>
        <Button variant="primary">Connexion (placeholder)</Button>
      </Card>
    </div>
  )
}
