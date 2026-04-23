import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('should display the contact form', async ({ page }) => {
    await expect(page.getByPlaceholder('Delisha Marie')).toBeVisible();
    await expect(page.getByPlaceholder('hello@delishamarie.com')).toBeVisible();
  });

  test('should fill out the form fields', async ({ page }) => {
    await page.getByPlaceholder('Delisha Marie').fill('Robot Tester');
    await page.getByPlaceholder('hello@delishamarie.com').fill('test@example.com');
    await page.getByPlaceholder('Recipe question').fill('Automated Test');
    await page
      .getByPlaceholder('Your beautiful message...')
      .fill('Testing the structured directory setup.');

    const submitBtn = page.getByRole('button', { name: 'Send Message' });
    await expect(submitBtn).toBeEnabled();
  });
});
