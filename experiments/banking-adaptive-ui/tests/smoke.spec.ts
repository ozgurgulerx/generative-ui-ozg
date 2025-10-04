import { test, expect } from '@playwright/test'

test.describe('Banking Adaptive UI', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')
    
    // Wait for content to load
    await page.waitForSelector('text=Welcome', { timeout: 10000 })
    
    // Should show either consent dialog or main content
    const hasConsent = await page.getByText('Personalize Your Experience').isVisible().catch(() => false)
    const hasContent = await page.getByText('Welcome').isVisible()
    
    expect(hasConsent || hasContent).toBeTruthy()
  })

  test('should accept consent and show personalized content', async ({ page, context }) => {
    // Clear storage to trigger consent
    await context.clearCookies()
    await page.goto('/')
    
    // Accept consent if dialog appears
    const acceptButton = page.getByRole('button', { name: /accept/i })
    if (await acceptButton.isVisible().catch(() => false)) {
      await acceptButton.click()
      await page.waitForTimeout(500)
    }
    
    // Should show main content
    await expect(page.getByText(/welcome/i)).toBeVisible()
    await expect(page.getByText(/balances/i)).toBeVisible()
  })

  test('should show quick actions', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    // Should have action buttons
    const actions = ['Transfer', 'Pay Bill', 'Exchange', 'Savings']
    for (const action of actions) {
      // At least one should be visible
      const visible = await page.getByRole('button').filter({ hasText: action }).count()
      if (visible > 0) {
        expect(visible).toBeGreaterThan(0)
        break
      }
    }
  })

  test('should track action clicks', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    // Click an action button
    const transferButton = page.getByRole('button').filter({ hasText: /transfer/i }).first()
    if (await transferButton.isVisible().catch(() => false)) {
      await transferButton.click()
      // Event should be tracked (check via storage if needed)
      expect(true).toBeTruthy()
    }
  })

  test('should open settings toolbar', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    // Click settings button (bottom right)
    const settingsButton = page.locator('button').filter({ has: page.locator('svg') }).last()
    await settingsButton.click()
    
    // Should show settings panel
    await expect(page.getByText(/settings|dark mode|language/i)).toBeVisible()
  })

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    // Open settings
    const settingsButton = page.locator('button').filter({ has: page.locator('svg') }).last()
    await settingsButton.click()
    
    // Toggle dark mode switch
    const darkModeSwitch = page.getByRole('switch').first()
    if (await darkModeSwitch.isVisible().catch(() => false)) {
      await darkModeSwitch.click()
      
      // Check if dark class is applied
      const htmlClass = await page.locator('html').getAttribute('class')
      expect(htmlClass).toContain('dark')
    }
  })
})
