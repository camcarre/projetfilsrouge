/**
 * Mock API – à remplacer par les appels Supabase / Edge Functions en Phase 2.
 */

export const mockPortfolio = {
  totalValue: 0,
  assets: [],
}

export const mockEtfRecommendations = []

export async function fetchMockPortfolio() {
  return Promise.resolve(mockPortfolio)
}

export async function fetchMockEtfRecommendations() {
  return Promise.resolve(mockEtfRecommendations)
}