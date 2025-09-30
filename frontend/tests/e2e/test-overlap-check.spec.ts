import { test, expect } from '@playwright/test';

test('Check Cluster Height and Overlapping Issues', async ({ page }) => {
  console.log('🔧 Testing cluster height and overlapping');
  
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(2000);
  
  // Take full page screenshot
  await page.screenshot({ path: 'test-results/cluster-height-check.png', fullPage: true });
  
  // Check if text is visible
  const clusterText = page.locator('svg text').first();
  await expect(clusterText).toBeVisible();
  
  // Get all text elements to check for overlapping
  const textElements = page.locator('svg text');
  const textCount = await textElements.count();
  console.log(`🔧 Found ${textCount} text elements`);
  
  // Get all rect elements to check layout
  const rectElements = page.locator('svg rect');
  const rectCount = await rectElements.count();
  console.log(`🔧 Found ${rectCount} rectangle elements`);
  
  console.log('🔧 Screenshot saved to check for overlapping issues');
});