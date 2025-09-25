import { test } from '@playwright/test';

test('Iteration 2 - Improved D3 Icicle Layout', async ({ page }) => {
  console.log('🔧 Testing D3 Icicle Layout - Iteration 2');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(5000);
  
  // Screenshot iteration 2
  await page.screenshot({ path: 'test-results/icicle-iteration-2.png', fullPage: true });
  
  console.log('🔧 Icicle Layout Iteration 2 completed');
});