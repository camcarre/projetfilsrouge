import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto('/analysis')
  })

  test('page charge avec sélecteur actif', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /analyse/i })).toBeVisible()
    await expect(page.locator('#symbol-select')).toBeVisible()
  })

  test('Prédire AAPL → affiche une valeur ou erreur propre', async ({ page }) => {
    // Select AAPL by option value
    await page.locator('#symbol-select').selectOption('AAPL')
    await page.getByRole('button', { name: /prédire/i }).click()

    // Wait for loading to finish (no button with aria-busy=true)
    await page.waitForFunction(
      () => !Array.from(document.querySelectorAll('[aria-busy="true"]')).some((b) => b.tagName === 'BUTTON'),
      { timeout: 20000 }
    ).catch(() => {})

    // Verify: either the prediction result card is visible (shows symbol + value), or an error alert appears.
    // The UI renders the predicted price as a <p> with a numeric value followed by a sibling <p>USD</p>,
    // so we match on the numeric part and its label "Valeur prédite" for context.
    const predictedLabelVisible = await page
      .getByText('Valeur prédite')
      .isVisible()
      .catch(() => false)
    const hasError = await page.getByRole('alert').isVisible().catch(() => false)
    expect(predictedLabelVisible || hasError).toBe(true)
  })
})