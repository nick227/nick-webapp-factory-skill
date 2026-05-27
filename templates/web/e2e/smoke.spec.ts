/**
 * Golden-path smoke test. Verifies the core auth loop and the main
 * landing page load. Adapt the selectors and URLs to match the project.
 *
 * Seed credentials come from packages/db/prisma/seed.ts.
 * Run seed before tests: pnpm db:seed
 */
import { test, expect } from '@playwright/test'

const ALICE_EMAIL    = 'alice@example.com'
const ALICE_PASSWORD = 'password123'

test.describe('auth flow', () => {
  test('login → protected page → logout', async ({ page }) => {
    await page.goto('/')

    // Should land on login when unauthenticated
    await expect(page).toHaveURL(/\/login/)

    // Log in
    await page.getByLabel(/email/i).fill(ALICE_EMAIL)
    await page.getByLabel(/password/i).fill(ALICE_PASSWORD)
    await page.getByRole('button', { name: /log in|sign in/i }).click()

    // Should redirect to the main authenticated page
    // ADAPT: change this URL/path to match the app's post-login route
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page).toHaveURL(/\/feed|\/dashboard|\/home|\//)

    // Log out
    // ADAPT: update selector to match the app's logout button/menu
    await page.getByRole('button', { name: /log out|sign out/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('register a new account', async ({ page }) => {
    await page.goto('/register')

    // ADAPT: update selectors to match the app's registration form fields
    await page.getByLabel(/email/i).fill('newuser@example.com')
    await page.getByLabel(/username/i).fill('newuser')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /register|sign up|create account/i }).click()

    // Should end up on the authenticated landing page
    await expect(page).not.toHaveURL(/\/register/)
  })

  test('unauthenticated access redirects to login', async ({ page }) => {
    // ADAPT: replace with an actual protected route from the app
    await page.goto('/feed')
    await expect(page).toHaveURL(/\/login/)
  })
})

// EXTEND: add app-specific flows below, e.g.:
//
// test.describe('posts', () => {
//   test.beforeEach(async ({ page }) => {
//     await loginAs(page, ALICE_EMAIL, ALICE_PASSWORD)
//   })
//
//   test('create a post', async ({ page }) => {
//     await page.goto('/feed')
//     await page.getByRole('button', { name: /new post/i }).click()
//     await page.getByRole('textbox').fill('Hello from Playwright')
//     await page.getByRole('button', { name: /post|publish/i }).click()
//     await expect(page.getByText('Hello from Playwright')).toBeVisible()
//   })
// })

// Utility — reuse across tests when auth state isn't persisted
async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /log in|sign in/i }).click()
  await page.waitForURL(/\/feed|\/dashboard|\/home|\//)
}
