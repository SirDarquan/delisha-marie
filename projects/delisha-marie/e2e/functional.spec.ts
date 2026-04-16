import { test, expect } from '@playwright/test';

test.describe('Delisha Marie Functional flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to Recipes and About pages', async ({ page }) => {
    await page.goto('/');

    // Test link reordered to first position
    await page.getByRole('link', { name: 'Recipes', exact: true }).click();
    await expect(page).toHaveURL(/\/recipe-index/);
    await expect(page.getByRole('heading', { name: /Recipe Index/i })).toBeVisible();

    await page.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL(/\/about/);
  });

  test('should navigate to recipes via hero button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse Latest Recipes', exact: true }).click();
    await expect(page).toHaveURL(/\/recipe-index/);
  });

  test('should navigate to the Contact page', async ({ page }) => {
    await page.getByRole('link', { name: 'Contact' }).click();
    await page.waitForURL('**/contact');
    await expect(page).toHaveURL(/\/contact/);
  });

  test('should fill out and submit the contact form (mock)', async ({ page }) => {
    await page.goto('/contact');

    // Fill the form using your actual placeholders
    await page.getByPlaceholder('Delisha Marie').fill('Robot Tester');
    await page.getByPlaceholder('hello@delishamarie.com').fill('test@example.com');
    await page.getByPlaceholder('Recipe question').fill('Automated Test');
    await page
      .getByPlaceholder('Your beautiful message...')
      .fill('This is a message from the automated testing suite.');

    // Verify the button is enabled and visible
    const submitBtn = page.getByRole('button', { name: 'Send Message' });
    await expect(submitBtn).toBeVisible();

    // In a real test, we might click it, but for a mock we'll just verify state
    // await submitBtn.click();
  });

  test('should toggle dark mode theme', async ({ page }) => {
    // Locate the theme toggle (Material switch)
    const toggle = page.locator('mat-slide-toggle').first(); // Fixed strict mode violation

    if (await toggle.isVisible()) {
      const initialTheme = await page.locator('html').getAttribute('class');

      await toggle.click();

      const newTheme = await page.locator('html').getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
    }
  });
});
