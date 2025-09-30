import { test, expect, Page } from '@playwright/test';

test('Visual Debug - Capture Actual Visualizer', async ({ page }) => {
  console.log('\n🔍 VISUAL DEBUG - FINDING THE ACTUAL VISUALIZER');
  
  // Navigate and get to capacity tab
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  
  const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
  await capacityTab.click();
  await page.waitForTimeout(3000);
  
  // Scroll down to find the visualization
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);
  
  // Take a full page screenshot
  await page.screenshot({ path: '/tmp/debug-full-page.png', fullPage: true });
  console.log('📸 Full page screenshot taken');
  
  // Find all SVG elements and their positions
  const svgs = await page.locator('svg').all();
  console.log(`Found ${svgs.length} SVG elements total`);
  
  for (let i = 0; i < svgs.length; i++) {
    const svg = svgs[i];
    const bbox = await svg.boundingBox();
    if (bbox) {
      console.log(`SVG ${i}: position (${bbox.x}, ${bbox.y}), size ${bbox.width}x${bbox.height}`);
      
      // Only screenshot substantial SVGs
      if (bbox.width > 50 && bbox.height > 50) {
        await svg.screenshot({ path: `/tmp/debug-svg-${i}.png` });
        
        // Analyze what's inside this SVG
        const rects = await svg.locator('rect').count();
        const texts = await svg.locator('text').count();
        const foreignObjects = await svg.locator('foreignObject').count();
        
        console.log(`  SVG ${i} content: ${rects} rects, ${texts} texts, ${foreignObjects} icons`);
        
        // If this looks like our main visualizer, get more details
        if (rects > 10 || texts > 5) {
          console.log(`  🎯 This looks like the main visualizer!`);
          
          // Try clicking on rectangles in this SVG to test zoom
          const hostRects = await svg.locator('rect[fill*="rgba(139, 92, 246"]').all();
          if (hostRects.length > 0) {
            console.log(`  Found ${hostRects.length} host rectangles, testing zoom...`);
            
            await hostRects[0].click();
            await page.waitForTimeout(1500);
            await svg.screenshot({ path: `/tmp/debug-svg-${i}-zoomed.png` });
            
            await hostRects[0].click(); // Click again to toggle
            await page.waitForTimeout(1500);
            await svg.screenshot({ path: `/tmp/debug-svg-${i}-unzoomed.png` });
          }
        }
      }
    }
  }
  
  console.log('📋 Visual debug complete - check /tmp/debug-*.png files');
});