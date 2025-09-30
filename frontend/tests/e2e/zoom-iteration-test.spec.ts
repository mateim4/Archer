import { test, expect } from '@playwright/test';

test('Comprehensive zoom testing and iteration', async ({ page }) => {
  console.log('🔍 Starting zoom iteration testing');
  
  await page.goto('/', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/tmp/zoom-iter-start.png', fullPage: true });
  console.log('📸 Start state captured');
  
  try {
    // Try to find projects page or capacity visualizer
    let found = false;
    
    // Method 1: Look for projects and try to enter one
    const projectCards = page.locator('.lcm-card');
    if (await projectCards.count() > 0) {
      console.log('📋 Found project cards, clicking first one');
      await projectCards.first().click();
      await page.waitForTimeout(3000);
      found = true;
    }
    
    if (!found) {
      // Method 2: Try navigating to projects
      const projectsNav = page.locator('text=Projects');
      if (await projectsNav.count() > 0) {
        await projectsNav.click();
        await page.waitForTimeout(2000);
        const projectCards2 = page.locator('.lcm-card');
        if (await projectCards2.count() > 0) {
          await projectCards2.first().click();
          await page.waitForTimeout(3000);
          found = true;
        }
      }
    }
    
    // Look for the capacity visualizer
    await page.screenshot({ path: '/tmp/zoom-iter-after-nav.png', fullPage: true });
    
    // Try to find SVG with clusters
    const svg = page.locator('svg').first();
    const clusters = page.locator('g[class*="cluster-"]');
    const clusterCount = await clusters.count();
    
    console.log(`🔍 Found ${clusterCount} clusters`);
    
    if (clusterCount > 0) {
      console.log('✅ Found capacity visualizer with clusters');
      
      // Test 1: Initial state
      await page.screenshot({ path: '/tmp/zoom-test-1-initial.png', fullPage: true });
      await page.waitForTimeout(1000);
      
      // Test 2: Click first cluster
      console.log('🎯 Clicking first cluster');
      await clusters.first().click();
      await page.waitForTimeout(2000); // Wait for animation
      await page.screenshot({ path: '/tmp/zoom-test-2-cluster1.png', fullPage: true });
      
      // Test 3: Click second cluster (if exists)
      if (clusterCount > 1) {
        console.log('🎯 Clicking second cluster');
        await clusters.nth(1).click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/zoom-test-3-cluster2.png', fullPage: true });
      }
      
      // Test 4: Try host click
      const hosts = page.locator('g[class*="host-"]');
      const hostCount = await hosts.count();
      console.log(`🏠 Found ${hostCount} hosts`);
      
      if (hostCount > 0) {
        console.log('🎯 Clicking first host');
        await hosts.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/zoom-test-4-host.png', fullPage: true });
      }
      
      // Test 5: Background click to zoom out
      console.log('🎯 Clicking background to zoom out');
      await svg.click({ position: { x: 50, y: 50 } });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/zoom-test-5-zoomout.png', fullPage: true });
      
      // Test 6: Click same cluster twice to test toggle
      console.log('🎯 Testing toggle behavior');
      await clusters.first().click();
      await page.waitForTimeout(1000);
      await clusters.first().click(); // Same cluster again
      await page.waitForTimeout(2000);
      await page.screenshot({ path: '/tmp/zoom-test-6-toggle.png', fullPage: true });
      
    } else {
      console.log('❌ Could not find capacity visualizer');
      await page.screenshot({ path: '/tmp/zoom-iter-no-viz.png', fullPage: true });
    }
    
  } catch (error) {
    console.log('❌ Error during zoom iteration:', error);
    await page.screenshot({ path: '/tmp/zoom-iter-error.png', fullPage: true });
  }
  
  console.log('✅ Zoom iteration testing completed');
});