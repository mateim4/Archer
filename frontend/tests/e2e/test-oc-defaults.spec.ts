import { test } from '@playwright/test';

test('Test OC ratio defaults updated', async ({ page }) => {
  console.log('🔧 Testing updated OC ratio defaults');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Screenshot showing new default OC ratios
  await page.screenshot({ path: 'test-results/oc-defaults-updated.png', fullPage: true });
  
  console.log('🔧 OC ratio defaults test completed');
});