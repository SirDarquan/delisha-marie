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
    const jumpLinkA = page.getByRole('button', { name: 'A', exact: true });
    await expect(jumpLinkA).toBeVisible();

    await jumpLinkA.click();
    // Check that the URL is not updated with a hash
    await expect(page).not.toHaveURL(/#A$/);

    const sectionA = page.locator('#A');
    await expect(sectionA).toBeVisible();
  });

  test('should have back to top buttons in ingredient sections', async ({ page }) => {
    const backToTop = page.getByRole('button', { name: /back to top/i }).first();
    await expect(backToTop).toBeVisible();

    await backToTop.click();
    await expect(page).not.toHaveURL(/#recipe-by-ingredients$/);
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
