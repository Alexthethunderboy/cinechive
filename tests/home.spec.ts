import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // These journeys exercise the returning-user experience. The product tour
  // has its own dismissal flow and should not interrupt unrelated controls.
  await page.addInitScript(() => {
    window.localStorage.setItem('cinechive_tour_complete', 'true');
  });
});

test('public discovery loads when account services are disabled', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CineChive/);
  await expect(page.getByRole('heading', { name: 'CINE CHIVE' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Local archive active');
  await expect(page.getByRole('button', { name: 'New and Trending' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Release Radar' })).toBeVisible();
  await page.waitForTimeout(1500);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('public search remains accessible', async ({ page }) => {
  await page.goto('/');
  const searchEntry = page
    .getByRole('link', { name: 'Search' })
    .or(page.getByRole('textbox', { name: 'Search titles, people...' }))
    .filter({ visible: true })
    .first();
  await expect(searchEntry).toBeVisible();
});

test('shared library opens from the homepage without authentication', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Shared library' }).click();
  await expect(page).toHaveURL(/\/shared$/);
  await expect(page.getByRole('heading', { name: 'Shared with you.' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText(/username|password/i)).toHaveCount(0);
});

test('personal library opens directly in local mode', async ({ page }) => {
  await page.goto('/vault');
  await expect(page).toHaveURL(/\/vault$/);
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
  await expect(page.getByText(/Local Library/)).toBeVisible();
});

test('local collections persist after reload', async ({ page }) => {
  await page.goto('/vault');
  await page.getByRole('button', { name: /New Collection/i }).click();
  await page.getByPlaceholder('e.g., Noir Masterpieces').fill('Offline Favourites');
  await page.getByPlaceholder('Describe the vibe of this collection...').fill('Stored on this device');
  await page.getByRole('button', { name: 'Create Collection' }).click();
  await expect(page.getByRole('heading', { name: 'Offline Favourites' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Offline Favourites' })).toBeVisible();
});

test('local profile and settings are available without sign-in', async ({ page }) => {
  await page.goto('/profile/settings');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByPlaceholder('Your name').fill('Offline Curator');
  await page.getByRole('button', { name: /Save Changes/i }).click();
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Offline Curator' })).toBeVisible();
});

test('social-only routes explain the local-mode boundary', async ({ page }) => {
  await page.goto('/community');
  await expect(page).toHaveURL(/\/local-mode$/);
  await expect(page.getByRole('heading', { name: /private archive still works/i })).toBeVisible();
  await expect(page.getByText('Community posts and reactions between people')).toBeVisible();
});
