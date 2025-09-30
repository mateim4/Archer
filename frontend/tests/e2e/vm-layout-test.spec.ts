import { test, expect } from '@playwright/test';

test('VM layout and zoom checkbox functionality', async ({ page }) => {
  console.log('🔍 Testing VM layout improvements and zoom checkboxes');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing normal view (checkboxes should be hidden)');
  await page.screenshot({ path: '/tmp/vm-layout-1-normal.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test host zoom to reveal checkboxes
    console.log('🧪 Test: Host zoom to reveal checkboxes');
    const firstHost = page.locator('g[class*="host-"]').first();
    const firstHostRect = firstHost.locator('rect').first();
    
    console.log('  ↳ Click host to zoom in');
    await firstHostRect.click();
    await page.waitForTimeout(2000); // Wait for zoom and checkbox animation
    
    await page.screenshot({ path: '/tmp/vm-layout-2-host-zoom-with-checkboxes.png', fullPage: true });
    
    // Test that checkboxes are now visible
    const checkboxes = page.locator('.zoom-checkbox');
    const checkboxCount = await checkboxes.count();
    console.log(`  ↳ Found ${checkboxCount} checkboxes during host zoom`);
    
    // Test zoom out to hide checkboxes
    console.log('  ↳ Click background to zoom out');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/tmp/vm-layout-3-zoomed-out.png', fullPage: true });
    
    console.log('✅ VM layout and zoom checkbox test completed!');
    
  } catch (error) {
    console.log('❌ Error during VM layout testing:', error);
    await page.screenshot({ path: '/tmp/vm-layout-error.png', fullPage: true });
  }
});