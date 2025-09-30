import { test, expect } from '@playwright/test';

test('Direct zoom test via dev server', async ({ page }) => {
  console.log('🎯 Direct zoom testing');
  
  // Navigate directly to dev server
  await page.goto('http://localhost:1420', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/tmp/direct-zoom-1-start.png', fullPage: true });
  console.log('📸 Start captured');
  
  try {
    // Click "Start Planning" to enter app
    const startButton = page.locator('text=Start Planning');
    if (await startButton.isVisible()) {
      console.log('🚀 Clicking Start Planning');
      await startButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/direct-zoom-2-entered-app.png', fullPage: true });
    }
    
    // Look for project cards (they're visible in the screenshot)
    const projectCards = page.locator('[role="button"], .project-card, div:has-text("Cloud Migration Project"), div:has-text("Enterprise Infrastructure")').first();
    
    if (await projectCards.isVisible()) {
      console.log('📋 Clicking first project');
      await projectCards.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/direct-zoom-3-in-project.png', fullPage: true });
      
      // Now look for capacity visualizer
      const svg = page.locator('svg').last(); // Get the main visualizer SVG
      const clusters = page.locator('g[class*="cluster-"]');
      const clusterCount = await clusters.count();
      
      console.log(`🎯 Found ${clusterCount} clusters in visualizer`);
      
      if (clusterCount > 0) {
        console.log('✅ Found capacity visualizer!');
        
        // Test zoom functionality
        console.log('🔍 Testing zoom - clicking first cluster');
        await clusters.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/direct-zoom-4-cluster-zoom.png', fullPage: true });
        
        console.log('🔍 Testing zoom - clicking same cluster to zoom out');
        await clusters.first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/direct-zoom-5-zoom-out.png', fullPage: true });
        
        // Test host zoom if hosts exist
        const hosts = page.locator('g[class*="host-"]');
        const hostCount = await hosts.count();
        console.log(`🏠 Found ${hostCount} hosts`);
        
        if (hostCount > 0) {
          console.log('🔍 Testing host zoom');
          await hosts.first().click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/tmp/direct-zoom-6-host-zoom.png', fullPage: true });
          
          // Background click to zoom out
          console.log('🔍 Background click to zoom out');
          await svg.click({ position: { x: 50, y: 50 } });
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/tmp/direct-zoom-7-final.png', fullPage: true });
        }
        
        console.log('✅ Zoom testing completed successfully!');
      } else {
        console.log('❌ No clusters found in visualizer');
        await page.screenshot({ path: '/tmp/direct-zoom-no-clusters.png', fullPage: true });
      }
    } else {
      console.log('❌ No project cards found');
      await page.screenshot({ path: '/tmp/direct-zoom-no-projects.png', fullPage: true });
    }
    
  } catch (error) {
    console.log('❌ Error during direct zoom test:', error);
    await page.screenshot({ path: '/tmp/direct-zoom-error.png', fullPage: true });
  }
});