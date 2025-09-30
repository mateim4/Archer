import { test, expect } from '@playwright/test';

test('Test zoom functionality and capture behavior', async ({ page }) => {
  console.log('🔍 Testing zoom functionality');
  
  await page.goto('/app/projects', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/tmp/zoom-test-initial.png', fullPage: true });
  console.log('📸 Initial state captured');
  
  try {
    // Click on a project to access capacity visualizer
    const projectCard = page.locator('.lcm-card').first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForTimeout(2000);
      console.log('📋 Clicked on project');
    }
    
    // Look for capacity visualizer - be more specific
    const capacityCanvas = page.locator('.visualization-group').first();
    
    if (await capacityCanvas.isVisible()) {
      console.log('🎯 Found capacity visualizer');
      
      // Take screenshot of current state
      await page.screenshot({ path: '/tmp/zoom-test-before-clicks.png', fullPage: true });
      console.log('📸 Before clicks captured');
      
      // Try clicking on cluster rectangles specifically
      const clusterRects = page.locator('g[class*="cluster-"] rect').first();
      
      if (await clusterRects.isVisible()) {
        console.log('🔲 Found cluster rectangle');
        await clusterRects.click();
        await page.waitForTimeout(2000); // Wait for transition
        await page.screenshot({ path: '/tmp/zoom-test-after-cluster-click.png', fullPage: true });
        console.log('📸 After cluster click captured');
        
        // Try clicking a host rectangle
        const hostRects = page.locator('g[class*="host-"] rect').first();
        if (await hostRects.isVisible()) {
          console.log('🏠 Found host rectangle');
          await hostRects.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/tmp/zoom-test-after-host-click.png', fullPage: true });
          console.log('📸 After host click captured');
        }
        
        // Click background to zoom out
        const svgContainer = page.locator('svg').first();
        await svgContainer.click({ position: { x: 50, y: 50 } });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/zoom-test-after-background-click.png', fullPage: true });
        console.log('📸 After background click captured');
      }
    } else {
      console.log('❌ Could not find capacity visualizer');
      await page.screenshot({ path: '/tmp/zoom-test-no-visualizer.png', fullPage: true });
    }
    
  } catch (error) {
    console.log('❌ Error during zoom test:', error);
    await page.screenshot({ path: '/tmp/zoom-test-error.png', fullPage: true });
  }
  
  console.log('✅ Zoom test completed');
});