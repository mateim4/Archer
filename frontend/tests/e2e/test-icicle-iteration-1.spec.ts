import { test } from '@playwright/test';

test('Iteration 1 - D3 Icicle Layout Test', async ({ page }) => {
  console.log('🔧 Testing D3 Icicle Layout - Iteration 1');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(5000); // Extra time for D3 rendering
  
  // Screenshot iteration 1
  await page.screenshot({ path: 'test-results/icicle-iteration-1.png', fullPage: true });
  
  console.log('🔧 Icicle Layout Iteration 1 completed');
});