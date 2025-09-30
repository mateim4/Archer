import { test, expect } from '@playwright/test';

test('Test Zoom Functionality - Click and Reset', async ({ page }) => {
  console.log('🔧 Testing zoom click functionality');
  
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Take screenshot before zoom
  await page.screenshot({ path: 'test-results/before-zoom-test.png', fullPage: true });
  
  // Try to click on a host rectangle to zoom in
  const hostRects = page.locator('svg rect');
  const rectCount = await hostRects.count();
  console.log(`🔧 Found ${rectCount} rectangles`);
  
  if (rectCount > 5) {
    // Click on a host rectangle (should be clickable)
    await hostRects.nth(3).click(); // Click 4th rectangle
    await page.waitForTimeout(2000);
    
    // Take screenshot after zoom
    await page.screenshot({ path: 'test-results/after-zoom-test.png', fullPage: true });
    
    // Click on background or root to zoom back out
    await page.click('svg', { position: { x: 50, y: 50 } }); // Click top-left area
    await page.waitForTimeout(2000);
    
    // Take screenshot after zoom out
    await page.screenshot({ path: 'test-results/after-zoom-out-test.png', fullPage: true });
  }
  
  console.log('🔧 Zoom functionality test completed');
});