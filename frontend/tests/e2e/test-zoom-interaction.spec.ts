import { test } from '@playwright/test';

test('Test Zoom Interaction - Click on Host', async ({ page }) => {
  console.log('🔧 Testing zoom interaction by clicking host');
  
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(5000);
  
  // Screenshot before zoom
  await page.screenshot({ path: 'test-results/before-zoom.png', fullPage: true });
  
  // Try to click on ESX-PROD-01 host to zoom in
  const hostRect = await page.locator('text=ESX-PROD-01').first();
  if (await hostRect.isVisible()) {
    await hostRect.click();
    await page.waitForTimeout(2000);
    
    // Screenshot after zoom
    await page.screenshot({ path: 'test-results/after-zoom.png', fullPage: true });
  }
  
  console.log('🔧 Zoom interaction test completed');
});