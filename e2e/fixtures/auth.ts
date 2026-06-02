import { Page } from '@playwright/test'

/**
 * Helper: logs in with the provided credentials.
 * Falls back to registering if login fails.
 */
export async function loginAs(
  page: Page,
  email = 'e2e-test@test.com',
  password = 'Test1234!'
): Promise<void> {
  await page.goto('/auth')

  // Fill credentials
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)

  // Try login first
  await page.getByRole('button', { name: /se connecter/i }).click()

  // If error, switch to register
  const hasAuthError = await page.getByRole('alert').isVisible().catch(() => false)
  const stillOnAuth = page.url().includes('/auth')

  if (hasAuthError && stillOnAuth) {
    await page.getByRole('button', { name: /créer un compte/i }).click()
    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: /s'inscrire/i }).click()
  }

  // Wait for navigation away from auth
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 10000 }).catch(() => {})
}