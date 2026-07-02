import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('URL inconnue → NotFound', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-xyz', { waitUntil: 'domcontentloaded' })
    expect(response, 'Réponse HTTP attendue').not.toBeNull()
    expect(response!.status()).not.toBeGreaterThanOrEqual(500)

    await expect(page.getByRole('heading', { level: 1, name: /Page introuvable/i })).toBeVisible()
    // Plusieurs éléments "Retour à l'accueil" (lien + bouton) → .first() requis en strict mode
    await expect(page.getByText(/Retour à l.accueil/i).first()).toBeVisible()
  })

  test('liens nav principaux présents', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const expected = ['Tableau de bord', 'Portefeuille', 'Analyse', 'ETF', 'Éducation']
    for (const label of expected) {
      await expect(page.getByRole('link', { name: new RegExp(`^${label}$`) }).first()).toBeVisible()
    }
  })

  test('item nav actif mis en évidence (emerald) sur /portfolio', async ({ page }) => {
    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' })

    const link = page.getByRole('link', { name: /^Portefeuille$/ }).first()
    await expect(link).toBeVisible()

    const cls = (await link.getAttribute('class')) ?? ''
    // Active link → bg-emerald (50 / 950) OU text-emerald (700 / 300)
    expect(cls, `Classe "active" (emerald) attendue sur /portfolio, reçu: ${cls}`).toMatch(/emerald/)
  })

  test('toggle dark mode → classe dark sur <html>', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const themeBtn = page.getByRole('button', { name: /Mode sombre|Mode clair/i }).first()
    await expect(themeBtn).toBeVisible()

    const initial = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    await themeBtn.click()

    if (initial) {
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false)
    } else {
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true)
    }

    // Re-toggle → retour à l'état initial
    await page.getByRole('button', { name: /Mode sombre|Mode clair/i }).first().click()
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(initial)
  })
})