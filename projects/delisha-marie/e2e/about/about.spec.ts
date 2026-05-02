import { test, expect } from '@playwright/test';

test.describe('About Page', () => {
  test('should navigate to and display the About page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About', exact: true }).first().click();
    await expect(page).toHaveURL(/\/about/);
    // Add specific text expectation if possible, e.g.
    // await expect(page.locator('h1')).toContainText(/About/i);
  });
});
