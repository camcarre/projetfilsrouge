import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Dashboard', () => {
  test('charge sans erreur 500', async ({ page }) => {
    await loginAs(page)
    await expect(page).toHaveURL(/\//)
    // No 500 error message should be visible
    await expect(page.getByText(/erreur serveur|500|internal server error/i)).not.toBeVisible()
  })

  test('navigation vers Analysis', async ({ page }) => {
    await loginAs(page)
    // Click on the Analysis quick link card
    await page.getByRole('link', { name: /analyse/i }).click()
    await expect(page).toHaveURL(/analysis/)
  })
})