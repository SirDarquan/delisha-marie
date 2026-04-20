import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage and check title', async ({ page }) => {
    await expect(page).toHaveTitle(/Delisha Marie/i);
  });

  test('should have essential navigation links', async ({ page }) => {
    const contactLinks = page.locator('text=Contact');
    await expect(contactLinks.first()).toBeVisible();
    
    const recipeLinks = page.getByRole('link', { name: 'Recipes', exact: true });
    await expect(recipeLinks.first()).toBeVisible();
  });

  test('should navigate to recipes via hero button', async ({ page }) => {
    await page.getByRole('link', { name: 'Browse Latest Recipes', exact: true }).click();
    await expect(page).toHaveURL(/\/recipe-index/);
  });
});
