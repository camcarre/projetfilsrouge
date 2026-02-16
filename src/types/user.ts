export type KnowledgeLevel = 'debutant' | 'intermediaire' | 'avance'

export interface UserProfile {
  id: string
  email: string
  displayName?: string
  knowledgeLevel?: KnowledgeLevel
}

export interface InvestorProfile {
  riskTolerance: 'conservateur' | 'modere' | 'dynamique'
  horizon: number // années
  objectives: string[]
}
