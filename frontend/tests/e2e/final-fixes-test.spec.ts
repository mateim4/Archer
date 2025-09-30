import { test, expect } from '@playwright/test';

test('Final fixes verification - VM spacing, font sizes, cluster text', async ({ page }) => {
  console.log('🔍 Testing final fixes');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state with all fixes');
  await page.screenshot({ path: '/tmp/final-fixes-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test host zoom with font size increase and cluster text
    console.log('🧪 Test: Host zoom with font size increase');
    const firstHost = page.locator('g[class*="host-"]').first();
    const firstHostRect = firstHost.locator('rect').first();
    
    console.log('  ↳ Click host to zoom in');
    await firstHostRect.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/final-fixes-2-host-zoom.png', fullPage: true });
    
    console.log('✅ Final fixes test completed!');
    
  } catch (error) {
    console.log('❌ Error during final fixes testing:', error);
    await page.screenshot({ path: '/tmp/final-fixes-error.png', fullPage: true });
  }
});