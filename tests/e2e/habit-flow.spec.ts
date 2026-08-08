import { expect, test } from '@playwright/test';

import { createTestUser, deleteTestUser, type TestUser } from './fixtures/test-user';

/**
 * FEATURE-SPEC §11 Phase H6: "signup → checkout → create habit → toggle →
 * detail view heatmap". The checkout step is skipped — billing isn't wired
 * to real Stripe this round (see docs/template-gaps.md); the entitlement
 * stub grants every authenticated user an active plan, so login goes
 * straight to an unlocked dashboard. Signup itself is done via a
 * service-role fixture (bypasses email confirmation) rather than the UI
 * form, since that step isn't automatable without a mailbox.
 */
test.describe('habit flow', () => {
  let user: TestUser;

  test.beforeAll(async () => {
    user = await createTestUser('habit-flow');
  });

  test.afterAll(async () => {
    await deleteTestUser(user.id);
  });

  test('login → create habit → toggle → view heatmap', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard/);

    await page.goto('/en/dashboard/habits');
    await page.getByRole('button', { name: 'Create habit' }).click();
    await page.getByLabel('Habit name').fill('Drink water');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Drink water')).toBeVisible();

    await page.goto('/en/dashboard');
    await page.getByRole('button', { name: 'Drink water' }).click();
    await expect(page.getByText('1/1 done')).toBeVisible();

    await page.goto('/en/dashboard/habits');
    await page.getByRole('link', { name: 'Drink water' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard\/habits\/.+/);
    await expect(page.getByRole('img', { name: /Heatmap/i })).toBeVisible();
    await expect(page.getByText('Current streak')).toBeVisible();
  });
});
