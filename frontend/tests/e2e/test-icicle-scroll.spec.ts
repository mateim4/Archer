import { test } from '@playwright/test';

test('Test scrolling to see full icicle layout', async ({ page }) => {
  console.log('🔧 Testing scrolling for full icicle view');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(5000);
  
  // Scroll down to see development cluster
  await page.evaluate(() => {
    window.scrollBy(0, 400);
  });
  await page.waitForTimeout(1000);
  
  // Screenshot showing both clusters
  await page.screenshot({ path: 'test-results/icicle-full-scroll.png', fullPage: true });
  
  console.log('🔧 Full icicle scroll test completed');
});