import { test, expect } from '@playwright/test';

test.describe('Capacity Visualizer Debug Tests', () => {
  test('Test VM rows, zoom functionality, and height scaling', async ({ page }) => {
    await page.goto('http://localhost:1420/app/projects');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Navigate to capacity visualizer (assuming there's a way to get there)
    await page.screenshot({ path: '/tmp/debug-1-projects-page.png', fullPage: true });
    
    // Try to find capacity visualizer elements
    const svgElements = await page.locator('svg').count();
    console.log(`Found ${svgElements} SVG elements`);
    
    if (svgElements > 0) {
      // Test VM rows visibility
      await page.screenshot({ path: '/tmp/debug-2-svg-found.png', fullPage: true });
      
      // Look for cluster rectangles
      const clusterRects = await page.locator('svg rect[fill="#36404a"]').count();
      console.log(`Found ${clusterRects} cluster rectangles`);
      
      // Look for host rectangles  
      const hostRects = await page.locator('svg rect[fill*="rgba(139, 92, 246, 0.3)"]').count();
      console.log(`Found ${hostRects} host rectangles`);
      
      // Look for VM rectangles
      const vmRects = await page.locator('svg rect[fill*="rgba(99, 102, 241, 0.6)"]').count();
      console.log(`Found ${vmRects} VM rectangles`);
      
      // Test host click for zoom
      if (hostRects > 0) {
        const firstHost = page.locator('svg rect[fill*="rgba(139, 92, 246, 0.3)"]').first();
        await page.screenshot({ path: '/tmp/debug-3-before-zoom.png', fullPage: true });
        
        await firstHost.click();
        await page.waitForTimeout(1000); // Wait for zoom transition
        
        await page.screenshot({ path: '/tmp/debug-4-after-zoom.png', fullPage: true });
        
        // Test zoom out by clicking again
        await firstHost.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: '/tmp/debug-5-after-zoom-out.png', fullPage: true });
      }
    }
    
    // Check for cluster icons (PremiumColor diamonds)
    const clusterIcons = await page.locator('svg foreignObject').count();
    console.log(`Found ${clusterIcons} cluster icons`);
    
    // Check for percentage text
    const percentageText = await page.locator('svg text.cluster-percentage-text').count();
    console.log(`Found ${percentageText} percentage texts`);
    
    // Final state screenshot
    await page.screenshot({ path: '/tmp/debug-6-final-state.png', fullPage: true });
  });
});