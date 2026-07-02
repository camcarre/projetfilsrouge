import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

// Compte démo seedé (9 actifs) : la carte Monte Carlo n'est rendue que si le
// portefeuille a au moins un actif (PortfolioPage: assets.length > 0).
const DEMO_EMAIL = 'demo@finance.app'
const DEMO_PASSWORD = 'Demo1234!'

test.describe('Monte Carlo (portefeuille)', () => {
  test('carte visible, sélecteur horizon, cône OU message propre', async ({ page }) => {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.goto('/portfolio', { waitUntil: 'domcontentloaded' })

    // Carte "Projection Monte Carlo" (h2 rendu par <Card title=...>)
    await expect(page.getByText(/Projection Monte Carlo/i).first()).toBeVisible()

    // Boutons d'horizon : "1 mois", "3 mois", "6 mois", "1 an"
    for (const label of ['1 mois', '3 mois', '6 mois', '1 an']) {
      await expect(page.getByRole('button', { name: new RegExp(`^${label}$`) })).toBeVisible()
    }

    // Cliquer "1 an" → cône (SVG) OU message propre (réseau yfinance requis)
    await page.getByRole('button', { name: /^1 an$/ }).click()
    const cone = page.getByLabel(/Cône de projection Monte Carlo/i)
    const median = page.getByText(/Médiane/i).first()
    const errorMsg = page.getByText(/Projection indisponible|Ajoutez des actifs/i).first()

    const ok = await Promise.race<{ ok: boolean }>([
      cone.waitFor({ state: 'visible', timeout: 20_000 }).then(() => ({ ok: true })),
      median.waitFor({ state: 'visible', timeout: 20_000 }).then(() => ({ ok: true })),
      errorMsg.waitFor({ state: 'visible', timeout: 20_000 }).then(() => ({ ok: true })),
    ]).catch(() => ({ ok: false }))

    expect(ok.ok, 'Ni cône, ni chiffres, ni message après clic sur "1 an"').toBe(true)

    // Re-cliquer "6 mois" → ne doit pas planter, la carte reste présente
    await page.getByRole('button', { name: /^6 mois$/ }).click()
    await expect(page.getByText(/Projection Monte Carlo/i).first()).toBeVisible()
  })
})
