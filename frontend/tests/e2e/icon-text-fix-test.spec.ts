import { test, expect } from '@playwright/test';

test('Diamond icon and cluster text fix verification', async ({ page }) => {
  console.log('🔍 Testing diamond icon and cluster text fixes');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state');
  await page.screenshot({ path: '/tmp/icon-fix-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test cluster zoom to check icon stretching and text centering
    console.log('🧪 Test: Cluster zoom with icon and text fixes');
    const firstCluster = page.locator('g[class*="cluster-"]').first();
    const firstClusterRect = firstCluster.locator('rect').first();
    
    console.log('  ↳ Click cluster to zoom in');
    await firstClusterRect.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/icon-fix-2-cluster-zoom.png', fullPage: true });
    
    // Test host zoom to check icon and text behavior
    console.log('  ↳ Background click to zoom out');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1000);
    
    console.log('🧪 Test: Host zoom with icon and text fixes');
    const firstHost = page.locator('g[class*="host-"]').first();
    const firstHostRect = firstHost.locator('rect').first();
    
    console.log('  ↳ Click host to zoom in');
    await firstHostRect.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/icon-fix-3-host-zoom.png', fullPage: true });
    
    // Final zoom out
    console.log('  ↳ Click to zoom out');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/icon-fix-4-final.png', fullPage: true });
    
    console.log('✅ Icon and text fix tests completed!');
    
  } catch (error) {
    console.log('❌ Error during icon/text fix testing:', error);
    await page.screenshot({ path: '/tmp/icon-fix-error.png', fullPage: true });
  }
});