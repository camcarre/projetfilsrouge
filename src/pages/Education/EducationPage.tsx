import { Card } from '@/components/ui/Card'

export function EducationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Éducation financière
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Glossaire">
          <p className="text-gray-600">
            Termes financiers expliqués.
          </p>
        </Card>
        <Card title="Guides et quiz">
          <p className="text-gray-600">
            Articles, guides d&apos;investissement, quiz et vidéos éducatives.
          </p>
        </Card>
      </div>
    </div>
  )
}
