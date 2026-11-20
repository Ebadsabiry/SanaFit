import { test, expect } from '@playwright/test';

test('four-week exercise guide supports GIF browsing, attendance, and mobile layout', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /four-week program|today/i }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'sabiry.dev' })).toHaveAttribute('href', 'https://sabiry.dev');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('.guide-shell')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('.guide-shell')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();

  await page.locator('.day-picker button').filter({ hasText: 'SAT' }).click();
  await expect(page.getByRole('heading', { name: 'Squat & quads' })).toBeVisible();
  await expect(page.locator('.guide-exercise-card')).toHaveCount(6);
  for (const image of await page.locator('.guide-exercise-card img').all()) {
    await expect(image).toHaveAttribute('src', /^https:\/\/cdn\.jsdelivr\.net\/gh\/JahelCuadrado\/ExerciseGymGifsDB@v1\.1\.0\//);
  }
  await expect(page.locator('.guide-exercise-card').nth(1).locator('img')).toHaveAttribute('src', /lever-horizontal-one-leg-press\.gif$/);
  await expect(page.locator('.guide-exercise-card').nth(4).locator('img')).toHaveAttribute('src', /lever-standing-calf-raise\.gif$/);
  await expect(page.locator('.guide-exercise-card').nth(5).locator('img')).toHaveAttribute('src', /dumbbell-lunge\.gif$/);
  await expect(page.locator('.exercise-visual').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('.guide-exercise-card').nth(1).locator('.exercise-hint')).toContainText('platform');

  await page.locator('.day-picker button').filter({ hasText: 'SUN' }).click();
  await expect(page.locator('.guide-exercise-card').nth(1).locator('img')).toHaveAttribute('src', /lever-seated-row\.gif$/);
  await expect(page.locator('.guide-exercise-card').nth(2).locator('img')).toHaveAttribute('src', /cable-lateral-pulldown-with-v-bar\.gif$/);
  await page.locator('.day-picker button').filter({ hasText: 'SAT' }).click();

  await page.getByRole('button', { name: /Mark gym attendance/ }).click();
  await expect(page.getByRole('button', { name: /Workout attended/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Progress', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your progress' })).toBeVisible();
  await expect(page.locator('.progress-week-card').first()).toContainText('1/5');
  await page.reload();
  await page.getByRole('button', { name: 'Progress', exact: true }).click();
  await expect(page.locator('.progress-week-card').first()).toContainText('1/5');

  await page.getByRole('button', { name: 'Exercises' }).click();
  await expect(page.getByRole('heading', { name: 'Exercises in your plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Legs', exact: true }).click();
  await expect(page.locator('.library-entry-label').first()).toContainText('Legs');
  await page.getByRole('searchbox', { name: 'Search plan exercises' }).fill('back squat');
  await expect(page.locator('.library-exercise-cards .guide-exercise-card h3')).toHaveText('Back squat');

  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
});
