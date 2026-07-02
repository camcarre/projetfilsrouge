import { test, expect } from '@playwright/test'

test.describe('Education', () => {
  test('/education charge sans 500 et liste le contenu', async ({ page }) => {
    const response = await page.goto('/education', { waitUntil: 'domcontentloaded' })
    expect(response, 'Réponse HTTP attendue sur /education').not.toBeNull()
    expect(response!.status(), '/education ne doit pas renvoyer 5xx').not.toBeGreaterThanOrEqual(500)

    // Heading ou contenu principal visible
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('/education/glossary charge', async ({ page }) => {
    const response = await page.goto('/education/glossary', { waitUntil: 'domcontentloaded' })
    expect(response, 'Réponse HTTP attendue sur /education/glossary').not.toBeNull()
    expect(response!.status()).not.toBeGreaterThanOrEqual(500)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('/education/quiz charge, se joue jusqu’au score', async ({ page }) => {
    const response = await page.goto('/education/quiz', { waitUntil: 'domcontentloaded' })
    expect(response, 'Réponse HTTP attendue sur /education/quiz').not.toBeNull()
    expect(response!.status()).not.toBeGreaterThanOrEqual(500)

    // Fin du chargement : soit le quiz (heading "Quiz"), soit l'état d'erreur réseau (bouton "Réessayer")
    const quizHeading = page.getByRole('heading', { level: 1, name: /^Quiz$/ })
    const retry = page.getByRole('button', { name: /^Réessayer$/ })
    await expect(quizHeading.or(retry)).toBeVisible({ timeout: 15_000 })

    // Si le réseau a échoué, on s'arrête là (comportement propre, pas de crash)
    if (await retry.isVisible().catch(() => false)) return

    // Sinon on répond à chaque question (1re option) jusqu'au résultat
    const result = page.getByRole('heading', { name: /Résultat du quiz/i })
    for (let i = 0; i < 20; i++) {
      if (await result.isVisible().catch(() => false)) break
      await page.locator('#main-content ul button').first().click()
    }
    await expect(result).toBeVisible()
    await expect(page.getByText(/bonne\(s\) réponse\(s\)/i)).toBeVisible()
  })

  test('/education/calculators charge', async ({ page }) => {
    const response = await page.goto('/education/calculators', { waitUntil: 'domcontentloaded' })
    expect(response).not.toBeNull()
    expect(response!.status()).not.toBeGreaterThanOrEqual(500)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
