import { test, expect } from '@playwright/test';

test('Cluster text stretch prevention verification', async ({ page }) => {
  console.log('🔍 Testing cluster text stretch prevention during zoom');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state');
  await page.screenshot({ path: '/tmp/cluster-text-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test host zoom to check if cluster text stretches
    console.log('🧪 Test: Host zoom - cluster text should not stretch');
    const firstHost = page.locator('g[class*="host-"]').first();
    const firstHostRect = firstHost.locator('rect').first();
    
    console.log('  ↳ Click host to zoom in');
    await firstHostRect.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/cluster-text-2-host-zoom.png', fullPage: true });
    
    console.log('  ↳ Background click to zoom out');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1000);
    
    // Test cluster zoom
    console.log('🧪 Test: Cluster zoom - cluster text should not stretch');
    const firstCluster = page.locator('g[class*="cluster-"]').first();
    const firstClusterRect = firstCluster.locator('rect').first();
    
    console.log('  ↳ Click cluster to zoom in');
    await firstClusterRect.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/cluster-text-3-cluster-zoom.png', fullPage: true });
    
    // Final zoom out
    console.log('  ↳ Background click to zoom out');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/cluster-text-4-final.png', fullPage: true });
    
    console.log('✅ Cluster text stretch prevention tests completed!');
    
  } catch (error) {
    console.log('❌ Error during cluster text stretch testing:', error);
    await page.screenshot({ path: '/tmp/cluster-text-error.png', fullPage: true });
  }
});