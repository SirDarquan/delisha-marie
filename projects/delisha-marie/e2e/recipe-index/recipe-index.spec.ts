import { test, expect } from '@playwright/test';

test.describe('Recipe Index Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipe-index');
  });

  test('should display search-like header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Recipe Index/i })).toBeVisible();
  });

  test('should navigate to alphabet sections via jump links', async ({ page }) => {
    // Wait for ingredients to load (fetched via API)
    const jumpLinkA = page.locator('a[href="/recipe-index#A"]');
    await expect(jumpLinkA).toBeVisible();

    await jumpLinkA.click();
    // Check if the scroll moved or just if the hash is updated
    await expect(page).toHaveURL(/#A$/);

    const sectionA = page.locator('#A');
    await expect(sectionA).toBeVisible();
  });

  test('should have back to top links in ingredient sections', async ({ page }) => {
    const backToTop = page.locator('a[href="/recipe-index#recipe-by-ingredients"]').first();
    await expect(backToTop).toBeVisible();
    await expect(backToTop).toContainText(/back to top/i);

    await backToTop.click();
    await expect(page).toHaveURL(/#recipe-by-ingredients$/);
  });

  test('should show correct counts for ingredients', async ({ page }) => {
    // Check for "Apple" count summing children or showing direct count
    // In our JSON, Apple has children summed to 48
    const appleLink = page.getByRole('link', { name: /Apple/i }).filter({ hasText: /\(48\)/ });
    await expect(appleLink).toBeVisible();
  });

  test('should navigate to specific ingredient tag pages', async ({ page }) => {
    const appleLink = page.getByRole('link', { name: /Apple/i }).filter({ hasText: /\(48\)/ });
    await expect(appleLink).toBeVisible();
    await appleLink.click({ force: true });
    await expect(page).toHaveURL(/\/tag\/apple/);
  });
});
