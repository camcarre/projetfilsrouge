import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

/**
 * Parcours de bout en bout : auth -> dashboard -> analyse -> ETF -> logout.
 * Assertions web-first (auto-wait), aucun sleep fixe : déterministe et rapide.
 */
test.describe('Finance PWA E2E Flow', () => {
  test('auth -> dashboard -> analyse -> ETF -> logout', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('pageerror', (err) => consoleErrors.push(`PAGE ERROR: ${err.message}`))

    // ---- Auth ---- (loginAs se connecte ou s'inscrit ; nav authentifiée = bouton Déconnexion)
    await loginAs(page)
    const logoutBtn = page.getByRole('button', { name: /déconnexion/i })
    await expect(logoutBtn).toBeVisible()

    // ---- Dashboard ---- accessible via la nav
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /tableau de bord/i })).toBeVisible()

    // ---- Analyse ---- sélection ticker + prédiction => résultat ou erreur propre
    await page.goto('/analysis')
    await expect(page.getByRole('heading', { name: /analyse/i })).toBeVisible()
    await page.locator('#symbol-select').selectOption('AAPL')
    await page.getByRole('button', { name: /prédire/i }).click()
    await page
      .waitForFunction(
        () =>
          !Array.from(document.querySelectorAll('[aria-busy="true"]')).some(
            (b) => b.tagName === 'BUTTON'
          ),
        { timeout: 20000 }
      )
      .catch(() => {})
    const predicted = await page.getByText('Valeur prédite').isVisible().catch(() => false)
    const analysisError = await page.getByRole('alert').isVisible().catch(() => false)
    expect(predicted || analysisError).toBe(true)

    // ---- ETF ---- la page se charge
    await page.goto('/etf')
    await expect(page.getByRole('heading', { name: /etf/i }).first()).toBeVisible()

    // ---- Logout ---- retour état déconnecté
    await logoutBtn.click()
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()

    // Pas d'erreur JS non gérée pendant le parcours
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })
})
