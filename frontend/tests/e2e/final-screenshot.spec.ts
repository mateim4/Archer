import { test } from '@playwright/test';

test('Take final screenshot of working vertical layout', async ({ page }) => {
  console.log('📸 Taking final screenshot of vertical layout');
  
  // Navigate to projects and access capacity visualizer
  await page.goto('/app/projects');
  await page.getByText('Cloud Migration Project').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Click on capacity tab
  await page.locator('[role="tab"]:has-text("Capacity")').click();
  await page.waitForTimeout(3000);
  
  // Take screenshot of the working layout
  await page.screenshot({ path: 'test-results/final-working-layout.png', fullPage: true });
  
  console.log('📸 Final screenshot saved: test-results/final-working-layout.png');
});