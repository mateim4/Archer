import { test, expect } from '@playwright/test';

test('Simple Zoom Test - Check Icicle Visualization', async ({ page }) => {
  console.log('🔧 Testing icicle visualization');
  
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(2000);
  
  // Check if the visualization is loaded
  const clusterText = page.locator('text=Production Cluster');
  await expect(clusterText).toBeVisible();
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/icicle-visualization.png', fullPage: true });
  
  // Try to find and interact with rectangles (the actual clickable elements)
  const rects = page.locator('svg rect');
  const rectCount = await rects.count();
  console.log(`🔧 Found ${rectCount} rectangles in the visualization`);
  
  if (rectCount > 0) {
    // Try clicking the first clickable rectangle (not free space)
    const clickableRects = rects.filter({ hasText: '' }); // Rectangles without text are usually the containers
    const clickableCount = await clickableRects.count();
    console.log(`🔧 Found ${clickableCount} clickable rectangles`);
    
    if (clickableCount > 1) {
      await clickableRects.nth(1).click(); // Click second rectangle (first might be root)
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/after-click.png', fullPage: true });
    }
  }
  
  console.log('🔧 Icicle visualization test completed');
});