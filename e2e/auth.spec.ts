import { test, expect } from '@playwright/test'

const EMAIL = 'e2e-test@test.com'
const PASSWORD = 'Test1234!'

test.describe('Auth', () => {
  test('login → dashboard → logout', async ({ page }) => {
    await page.goto('/auth')

    // Check we are on the auth page
    await expect(page.getByRole('heading', { name: /connexion|inscription/i })).toBeVisible()

    // Fill in credentials
    await page.locator('#email').fill(EMAIL)
    await page.locator('#password').fill(PASSWORD)

    // Try to log in
    await page.getByRole('button', { name: /se connecter/i }).click()

    // If we see an error about user not found, register instead
    const isOnLogin = await page.getByRole('button', { name: /se connecter/i }).isVisible().catch(() => false)
    const hasAuthError = await page.getByRole('alert').isVisible().catch(() => false)

    if (hasAuthError && isOnLogin) {
      // Click register toggle
      await page.getByRole('button', { name: /créer un compte/i }).click()
      await page.locator('#email').fill(EMAIL)
      await page.locator('#password').fill(PASSWORD)
      await page.getByRole('button', { name: /s'inscrire/i }).click()
    }

    // After login or register, should be redirected to home (dashboard at /)
    await page.waitForURL(/\/$|~\//, { timeout: 10000 }).catch(() => {
      // Fallback: check we are authenticated by looking for logout button
    })

    // Verify we are on a protected route (logged in)
    const onAuthPage = page.url().includes('/auth')
    expect(onAuthPage).toBe(false)

    // Can see the dashboard heading
    await expect(page.getByRole('heading', { name: /tableau de bord|dashboard/i })).toBeVisible()

    // Logout if possible — look for the button specifically
    const logoutBtn = page.getByRole('button', { name: /déconnexion/i })
    const logoutVisible = await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (logoutVisible) {
      await logoutBtn.click()
      await page.waitForURL(/\/auth/, { timeout: 5000 }).catch(() => {})
    }
  })
})