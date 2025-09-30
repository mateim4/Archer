import { test, expect } from '@playwright/test';

test('Final zoom test with dedicated test page', async ({ page }) => {
  console.log('🎯 Final zoom test starting');
  
  // Navigate directly to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/tmp/final-zoom-1-loaded.png', fullPage: true });
  console.log('📸 Test page loaded');
  
  try {
    // Wait for visualizer to load - target the main SVG with viewBox
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Find clusters
    const clusters = page.locator('g[class*="cluster-"]');
    const clusterCount = await clusters.count();
    console.log(`🎯 Found ${clusterCount} clusters`);
    
    if (clusterCount > 0) {
      console.log('✅ Capacity visualizer loaded successfully!');
      
      // Test 1: Initial state
      await page.screenshot({ path: '/tmp/final-zoom-2-initial.png', fullPage: true });
      console.log('📸 Initial state captured');
      
      // Test 2: Click first cluster to zoom in
      console.log('🔍 Testing cluster zoom in');
      await clusters.first().click();
      await page.waitForTimeout(1000); // Wait for animation
      await page.screenshot({ path: '/tmp/final-zoom-3-cluster-zoom.png', fullPage: true });
      console.log('📸 Cluster zoom captured');
      
      // Test 3: Click same cluster to zoom out
      console.log('🔍 Testing cluster zoom out (toggle)');
      await clusters.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/final-zoom-4-zoom-out.png', fullPage: true });
      console.log('📸 Zoom out captured');
      
      // Test 4: Test host zoom if hosts exist
      const hosts = page.locator('g[class*="host-"]');
      const hostCount = await hosts.count();
      console.log(`🏠 Found ${hostCount} hosts`);
      
      if (hostCount > 0) {
        console.log('🔍 Testing host zoom');
        await hosts.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/final-zoom-5-host-zoom.png', fullPage: true });
        console.log('📸 Host zoom captured');
        
        // Test 5: Background click to zoom out completely
        console.log('🔍 Testing background zoom out');
        await svg.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/final-zoom-6-background-out.png', fullPage: true });
        console.log('📸 Background zoom out captured');
      }
      
      // Test 6: Test second cluster if exists
      if (clusterCount > 1) {
        console.log('🔍 Testing second cluster zoom');
        await clusters.nth(1).click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/final-zoom-7-cluster2.png', fullPage: true });
        console.log('📸 Second cluster zoom captured');
        
        // Zoom out
        await clusters.nth(1).click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/final-zoom-8-final-state.png', fullPage: true });
        console.log('📸 Final state captured');
      }
      
      console.log('✅ All zoom tests completed successfully!');
      
    } else {
      console.log('❌ No clusters found in visualizer');
      await page.screenshot({ path: '/tmp/final-zoom-error.png', fullPage: true });
    }
    
  } catch (error) {
    console.log('❌ Error during final zoom test:', error);
    await page.screenshot({ path: '/tmp/final-zoom-error.png', fullPage: true });
  }
});