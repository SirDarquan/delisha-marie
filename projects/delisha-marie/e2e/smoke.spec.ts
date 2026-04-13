import { test, expect } from '@playwright/test';

test.describe('Delisha Marie Smoke Tests', () => {
  test('should load the homepage and check title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Delisha Marie/i);
  });

  test('should have essential contact information or links', async ({ page }) => {
    await page.goto('/');
    const contactLinks = page.locator('text=Contact');
    await expect(contactLinks.first()).toBeVisible();
  });
});
