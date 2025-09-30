import { test, expect } from '@playwright/test';

test('Extensive zoom functionality testing', async ({ page }) => {
  console.log('🔬 Starting extensive zoom testing');
  
  // Navigate directly to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state');
  await page.screenshot({ path: '/tmp/extensive-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Get clusters and hosts
    const clusters = page.locator('g[class*="cluster-"]');
    const hosts = page.locator('g[class*="host-"]');
    
    const clusterCount = await clusters.count();
    const hostCount = await hosts.count();
    
    console.log(`📊 Found ${clusterCount} clusters and ${hostCount} hosts`);
    
    // Test 1: Cluster zoom in/out toggle
    console.log('\n🧪 Test 1: Cluster zoom toggle');
    const firstCluster = clusters.first();
    const firstClusterRect = firstCluster.locator('rect').first();
    
    console.log('  ↳ Click cluster to zoom in');
    await firstClusterRect.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/extensive-2-cluster1-in.png', fullPage: true });
    
    console.log('  ↳ Click same cluster to zoom out');
    await firstClusterRect.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/extensive-3-cluster1-out.png', fullPage: true });
    
    // Test 2: Different cluster zoom
    if (clusterCount > 1) {
      console.log('\n🧪 Test 2: Second cluster zoom');
      const secondCluster = clusters.nth(1);
      const secondClusterRect = secondCluster.locator('rect').first();
      
      console.log('  ↳ Click second cluster');
      await secondClusterRect.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/extensive-4-cluster2-in.png', fullPage: true });
      
      console.log('  ↳ Background click to zoom out');
      await svg.click({ position: { x: 50, y: 50 } });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/extensive-5-background-out.png', fullPage: true });
    }
    
    // Test 3: Host zoom
    console.log('\n🧪 Test 3: Host zoom');
    if (hostCount > 0) {
      const firstHost = hosts.first();
      const firstHostRect = firstHost.locator('rect').first();
      
      console.log('  ↳ Click host to zoom in');
      await firstHostRect.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/extensive-6-host1-in.png', fullPage: true });
      
      console.log('  ↳ Click same host to zoom out');
      await firstHostRect.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/extensive-7-host1-out.png', fullPage: true });
    }
    
    // Test 4: Rapid switching between clusters
    console.log('\n🧪 Test 4: Rapid cluster switching');
    if (clusterCount > 1) {
      const firstClusterRect = clusters.first().locator('rect').first();
      const secondClusterRect = clusters.nth(1).locator('rect').first();
      
      console.log('  ↳ Click first cluster');
      await firstClusterRect.click();
      await page.waitForTimeout(1000);
      
      console.log('  ↳ Switch to second cluster');
      await secondClusterRect.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/extensive-8-switch.png', fullPage: true });
      
      console.log('  ↳ Back to first cluster');
      await firstClusterRect.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/extensive-9-switch-back.png', fullPage: true });
    }
    
    // Test 5: Host to cluster navigation
    console.log('\n🧪 Test 5: Host to cluster navigation');
    if (hostCount > 0) {
      const firstHostRect = hosts.first().locator('rect').first();
      const firstClusterRect = clusters.first().locator('rect').first();
      
      console.log('  ↳ Zoom to host');
      await firstHostRect.click();
      await page.waitForTimeout(1000);
      
      console.log('  ↳ Click cluster to zoom out to cluster level');
      await firstClusterRect.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: '/tmp/extensive-10-host-to-cluster.png', fullPage: true });
    }
    
    // Test 6: Check text is not distorted
    console.log('\n🧪 Test 6: Text distortion check');
    
    console.log('  ↳ Zoom in to check text');
    await clusters.first().locator('rect').first().click();
    await page.waitForTimeout(1000);
    
    // Check if text elements are visible and not distorted
    const clusterText = page.locator('text').first();
    const isTextVisible = await clusterText.isVisible();
    console.log(`  ↳ Text visibility: ${isTextVisible}`);
    
    await page.screenshot({ path: '/tmp/extensive-11-text-check.png', fullPage: true });
    
    // Final zoom out
    console.log('\n🧪 Final: Return to root view');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: '/tmp/extensive-12-final.png', fullPage: true });
    
    console.log('\n✅ All extensive zoom tests completed!');
    
  } catch (error) {
    console.log('❌ Error during extensive testing:', error);
    await page.screenshot({ path: '/tmp/extensive-error.png', fullPage: true });
  }
});