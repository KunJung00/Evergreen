import { expect, test } from '@playwright/test';

import {
  createTestHabit,
  createTestUser,
  deleteTestUser,
  type TestUser,
} from './fixtures/test-user';

/**
 * FEATURE-SPEC §11 Phase H6: user A's data must be invisible to user B, both
 * in a list (manage page) and by guessing a direct URL (detail page).
 */
test.describe('habit RLS', () => {
  let userA: TestUser;
  let userB: TestUser;
  let habitIdOwnedByA: string;

  test.beforeAll(async () => {
    userA = await createTestUser('rls-a');
    userB = await createTestUser('rls-b');
    habitIdOwnedByA = await createTestHabit(userA.id, "A's secret habit");
  });

  test.afterAll(async () => {
    await deleteTestUser(userA.id);
    await deleteTestUser(userB.id);
  });

  test("user B can't see user A's habit in the manage list", async ({ page }) => {
    await page.goto('/en/login');
    await page.getByLabel('Email').fill(userB.email);
    await page.getByLabel('Password', { exact: true }).fill(userB.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard/);

    await page.goto('/en/dashboard/habits');
    await expect(page.getByText("A's secret habit")).not.toBeVisible();
  });

  test("user B hitting user A's habit URL directly gets not-found, not the data", async ({
    page,
  }) => {
    await page.goto('/en/login');
    await page.getByLabel('Email').fill(userB.email);
    await page.getByLabel('Password', { exact: true }).fill(userB.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard/);

    await page.goto(`/en/dashboard/habits/${habitIdOwnedByA}`);
    await expect(page.getByText("A's secret habit")).not.toBeVisible();
    await expect(page.getByText('Page not found')).toBeVisible();
  });
});
