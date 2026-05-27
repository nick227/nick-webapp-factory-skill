import { test, expect } from '@playwright/test'

const ALICE_EMAIL = 'alice@example.com'
const ALICE_PASSWORD = 'password123'

test.describe('reference social feed', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  test('login -> feed -> create post -> logout', async ({ page }) => {
    const body = `Posted by Playwright ${Date.now()}`

    await page.goto('/')
    if (page.url().includes('/posts/feed')) {
      await page.getByRole('button', { name: /log out/i }).click()
    }
    await expect(page).toHaveURL(/\/login/)

    await page.getByLabel(/email/i).fill(ALICE_EMAIL)
    await page.getByLabel(/password/i).fill(ALICE_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/posts\/feed/)
    await expect(page.getByText(/reference app/i)).toBeVisible()

    await page.goto('/posts')
    await page.getByLabel(/body/i).fill(body)
    await page.getByRole('button', { name: /create post/i }).click()

    await expect(page).toHaveURL(/\/posts\/feed/)
    await expect(page.getByText(body)).toBeVisible()

    await page.getByRole('button', { name: /log out/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('register a new account', async ({ page }) => {
    const suffix = Date.now()

    await page.goto('/register')

    await page.getByLabel(/email/i).fill(`newuser-${suffix}@example.com`)
    await page.getByLabel(/username/i).fill(`newuser${suffix}`)
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page).toHaveURL(/\/posts\/feed/)
  })

  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('/posts/feed')
    await expect(page).toHaveURL(/\/login/)
  })
})
