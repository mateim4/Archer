import { test } from '@playwright/test';

test('Zoomable Icicle V1 - Cluster on Left', async ({ page }) => {
  console.log('🔧 Testing Zoomable Icicle with Cluster on Left');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(5000);
  
  // Screenshot of initial state with cluster on left
  await page.screenshot({ path: 'test-results/zoomable-icicle-v1-initial.png', fullPage: true });
  
  console.log('🔧 Zoomable Icicle V1 test completed');
});