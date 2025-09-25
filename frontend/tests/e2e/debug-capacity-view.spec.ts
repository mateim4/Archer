import { test } from '@playwright/test';

test('Debug capacity visualizer view', async ({ page }) => {
  console.log('📸 Taking screenshot of capacity visualizer');
  
  // Navigate to project detail
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Click on Capacity Visualizer tab
  await page.locator('[role="tab"]:has-text("Capacity")').click();
  await page.waitForTimeout(3000);
  
  // Screenshot of capacity view
  await page.screenshot({ path: 'test-results/capacity-full-view.png', fullPage: true });
  
  console.log('📸 Capacity visualizer screenshot saved');
});