import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Portfolio', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto('/portfolio')
  })

  test('page charge sans erreur 500', async ({ page }) => {
    await expect(page).toHaveURL(/portfolio/)
    await expect(page.getByText(/erreur serveur|500|internal server error/i)).not.toBeVisible()
  })

  test('affiche la page portfolio', async ({ page }) => {
    // Heading visible
    await expect(page.getByRole('heading', { name: /portefeuille|gestion/i })).toBeVisible()
  })
})