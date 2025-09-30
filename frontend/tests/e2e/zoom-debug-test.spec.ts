import { test, expect } from '@playwright/test';

test('Debug zoom behavior and cluster positioning', async ({ page }) => {
  console.log('🔍 Testing zoom behavior and cluster positioning');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state');
  await page.screenshot({ path: '/tmp/zoom-debug-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test cluster zoom first
    console.log('🧪 Test: Cluster zoom behavior');
    const firstCluster = page.locator('g[class*="cluster-"]').first();
    const clusterRect = firstCluster.locator('rect').first();
    
    console.log('  ↳ Click cluster to zoom in');
    await clusterRect.click();
    await page.waitForTimeout(2000); // Wait for zoom animation
    
    await page.screenshot({ path: '/tmp/zoom-debug-2-cluster-zoom.png', fullPage: true });
    
    // Zoom out
    console.log('  ↳ Click background to zoom out');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/tmp/zoom-debug-3-cluster-zoom-out.png', fullPage: true });
    
    // Test host zoom
    console.log('🧪 Test: Host zoom behavior');
    const firstHost = page.locator('g[class*="host-"]').first();
    const hostRect = firstHost.locator('rect').first();
    
    console.log('  ↳ Click host to zoom in');
    await hostRect.click();
    await page.waitForTimeout(2000); // Wait for zoom animation
    
    await page.screenshot({ path: '/tmp/zoom-debug-4-host-zoom.png', fullPage: true });
    
    // Zoom out
    console.log('  ↳ Click background to zoom out');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/tmp/zoom-debug-5-host-zoom-out.png', fullPage: true });
    
    console.log('✅ Zoom debug test completed!');
    
  } catch (error) {
    console.log('❌ Error during zoom debug testing:', error);
    await page.screenshot({ path: '/tmp/zoom-debug-error.png', fullPage: true });
  }
});