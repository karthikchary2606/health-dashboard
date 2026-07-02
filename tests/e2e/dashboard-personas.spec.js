const { test, expect } = require('@playwright/test');

test('dashboard does not stay in loading state after init', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#timelineContainer')).toHaveAttribute('data-state', /ready|empty|error/);
  await expect(page.locator('#sleepSummaryContent')).toHaveAttribute('data-state', /ready|empty|error/);
  await expect(page.locator('#timelineContainer')).not.toContainText('Loading...');
  await expect(page.locator('#sleepSummaryContent')).not.toContainText('Loading...');
});
