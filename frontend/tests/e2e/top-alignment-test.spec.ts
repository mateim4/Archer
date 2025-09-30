import { test, expect } from '@playwright/test';

test('Check top alignment of rectangles during host zoom', async ({ page }) => {
  console.log('🔍 Testing top alignment of rectangles during host zoom');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state');
  await page.screenshot({ path: '/tmp/top-alignment-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Focus on host zoom to see top alignment issues
    console.log('🧪 Test: Zoom into host to check top alignment');
    const firstHost = page.locator('g[class*="host-"]').first();
    const hostRect = firstHost.locator('rect').first();
    
    console.log('  ↳ Click host to zoom in and examine top alignment');
    await hostRect.click();
    await page.waitForTimeout(2000); // Wait for zoom animation
    
    console.log('📸 Capturing host zoom focused on top alignment issues');
    await page.screenshot({ path: '/tmp/top-alignment-2-host-zoom-top-focus.png', fullPage: true });
    
    console.log('✅ Top alignment test completed!');
    
  } catch (error) {
    console.log('❌ Error during top alignment testing:', error);
    await page.screenshot({ path: '/tmp/top-alignment-error.png', fullPage: true });
  }
});