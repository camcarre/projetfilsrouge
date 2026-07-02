import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Profile', () => {
  test('compte neuf : /profile/questionnaire "Votre profil investisseur", étape 1/5', async ({ page }) => {
    await loginAs(page) // nouveau compte → /profile/questionnaire

    await expect(page).toHaveURL(/\/profile\/questionnaire/)
    await expect(page.getByRole('heading', { level: 1, name: /Votre profil investisseur/i })).toBeVisible()
    // Le DOM rend "<span>{step} / {TOTAL_STEPS}</span>" (pas de mot "étape") → on matche "1 / 5" tel quel
    await expect(page.getByText('1 / 5').first()).toBeVisible()

    // Cliquer une vraie option de l'étape 1 (tolérance au risque), pas un
    // bouton du header (ex. Déconnexion).
    const firstAnswer = page.getByRole('button', { name: /Équilibré/ })
    await expect(firstAnswer).toBeVisible()
    await firstAnswer.click()

    // Le bouton "Suivant" devient actif après sélection
    const nextBtn = page.getByRole('button', { name: /^Suivant$/ })
    await expect(nextBtn).toBeVisible()
    await nextBtn.click()

    // On est passé à l'étape 2
    await expect(page.getByText('2 / 5').first()).toBeVisible()
  })

  test('/profile/edit charge sans erreur', async ({ page }) => {
    await loginAs(page)

    await page.goto('/profile/edit', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/profile\/edit$/)

    // Au moins un heading ou champ de formulaire visible
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})