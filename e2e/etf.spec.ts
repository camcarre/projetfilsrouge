import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('ETF - Comparateur', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await page.goto('/etf')
    await expect(page.getByRole('heading', { name: /recommandations etf/i })).toBeVisible()
  })

  test('page charge sans erreur 500', async ({ page }) => {
    await expect(page.getByText(/erreur serveur|500|internal server error/i)).not.toBeVisible()
  })

  test('ouvre le comparateur avec un état vide puis se ferme', async ({ page }) => {
    await page.getByRole('button', { name: /comparer une sélection/i }).click()

    await expect(page.getByText(/comparer des etf/i)).toBeVisible()
    await expect(page.getByText(/aucune sélection/i)).toBeVisible()

    await page.getByRole('button', { name: /fermer/i }).click()
    await expect(page.getByText(/comparer des etf/i)).not.toBeVisible()
    await expect(page.getByRole('button', { name: /comparer une sélection/i })).toBeVisible()
  })

  test('sélectionner 2 ETF depuis la liste affiche le graphique comparatif avec la légende', async ({ page }) => {
    await page.waitForSelector('ul.space-y-2 > li p.font-medium', { timeout: 15000 })
    await page.getByRole('button', { name: /comparer une sélection/i }).click()

    const rows = page.locator('ul.space-y-2 > li')
    await rows.nth(0).click({ timeout: 5000 })
    await rows.nth(1).click({ timeout: 5000 })

    await expect(page.getByRole('button', { name: /comparer \(2\/3\)/i })).toBeVisible()
    await expect(page.locator('ul.mt-3.flex.flex-wrap li')).toHaveCount(2, { timeout: 15000 })
  })
})
