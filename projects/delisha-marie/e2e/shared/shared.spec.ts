import { test, expect } from '@playwright/test';

test.describe('Shared Components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should toggle dark mode theme via toolbar', async ({ page }) => {
    const toggle = page.locator('mat-slide-toggle').first();

    if (await toggle.isVisible()) {
      const html = page.locator('html');
      const initialTheme = await html.getAttribute('class');

      await toggle.click();

      const newTheme = await html.getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('should navigate between pages using main navbar', async ({ page }) => {
    await page.getByRole('link', { name: 'Recipes', exact: true }).first().click();
    await expect(page).toHaveURL(/\/recipe-index/);

    await page.getByRole('link', { name: 'About', exact: true }).first().click();
    await expect(page).toHaveURL(/\/about/);

    await page.getByRole('link', { name: 'Contact', exact: true }).first().click();
    await expect(page).toHaveURL(/\/contact/);
  });
});
