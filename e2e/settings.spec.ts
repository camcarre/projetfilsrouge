import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Settings (/settings)', () => {
  test('anonyme : heading, toggle thème, dark sur <html>', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/settings$/)

    // Heading de la page
    await expect(page.getByRole('heading', { level: 1, name: /Paramètres/ })).toBeVisible()

    // Bouton de bascule du thème (header) — libellé change selon l'état
    const themeBtn = page.getByRole('button', { name: /Mode sombre|Mode clair/i }).first()
    await expect(themeBtn).toBeVisible()

    // Le html ne porte PAS la classe dark au départ
    const initialHasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'))

    // Toggle
    await themeBtn.click()

    // Web-first : attendre que l'état de la classe change
    if (initialHasDark) {
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false)
    } else {
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true)
    }

    // Re-toggle pour confirmer la réversibilité
    await themeBtn.click()
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(initialHasDark)
  })

  test('connecté : carte Règles d\'alerte + bouton ajout, Notifications récentes', async ({ page }) => {
    await loginAs(page)

    await page.goto('/settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: /Paramètres/ })).toBeVisible()

    // Carte "Règles d'alerte"
    await expect(page.getByText(/Règles d.alerte/i).first()).toBeVisible()

    // Bouton d'ajout de règle (tolère variantes de libellé)
    const addBtn = page.getByRole('button', { name: /Ajouter|Ajouter une règle|Nouvelle règle/i }).first()
    await expect(addBtn).toBeVisible()

    // Section "Notifications récentes" (texte ou heading)
    await expect(page.getByText(/Notifications récentes/i).first()).toBeVisible()
  })
})
