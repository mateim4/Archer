import { test } from '@playwright/test';

test('Debug current state', async ({ page }) => {
  console.log('📸 Taking screenshot of current state');
  
  // Navigate to project detail
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Screenshot of main view
  await page.screenshot({ path: 'test-results/current-main-view.png', fullPage: true });
  
  // Click on Capacity Visualizer tab
  await page.locator('[role="tab"]:has-text("Capacity")').click();
  await page.waitForTimeout(2000);
  
  // Screenshot of capacity view
  await page.screenshot({ path: 'test-results/current-capacity-view.png', fullPage: true });
  
  console.log('📸 Screenshots saved');
});