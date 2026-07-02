/**
 * Mock API – à remplacer par les appels Supabase / Edge Functions en Phase 2.
 */

export const mockPortfolio = {
  totalValue: 0,
  assets: [],
}

export async function fetchMockPortfolio() {
  return Promise.resolve(mockPortfolio)
}

// ponytail: code mort — non utilisés (audit 2026-07-02). Décommenter si ETF recommendations mock nécessaires.
// export const mockEtfRecommendations = []
// export async function fetchMockEtfRecommendations() {
//   return Promise.resolve(mockEtfRecommendations)
// }