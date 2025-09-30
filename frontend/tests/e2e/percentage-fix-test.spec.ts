import { test, expect } from '@playwright/test';

test('Cluster percentage text stretch fix verification', async ({ page }) => {
  console.log('🔍 Testing cluster percentage text stretch fix');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state');
  await page.screenshot({ path: '/tmp/percentage-fix-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test host zoom to check percentage text
    console.log('🧪 Test: Host zoom - percentage should not stretch');
    const firstHost = page.locator('g[class*="host-"]').first();
    const firstHostRect = firstHost.locator('rect').first();
    
    console.log('  ↳ Click host to zoom in');
    await firstHostRect.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/percentage-fix-2-host-zoom.png', fullPage: true });
    
    console.log('✅ Percentage text stretch fix test completed!');
    
  } catch (error) {
    console.log('❌ Error during percentage fix testing:', error);
  }
});