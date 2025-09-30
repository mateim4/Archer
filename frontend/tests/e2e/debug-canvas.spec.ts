import { test, expect } from '@playwright/test';

test('Debug Capacity Visualizer Canvas Issues', async ({ page }) => {
  console.log('🔍 Starting canvas debug test...');
  
  await page.goto('http://localhost:1420/app/projects');
  await page.waitForLoadState('networkidle');
  
  // Find and click on a project to access capacity visualizer
  const projectCard = page.locator('[data-testid="project-card"], .project-card, a[href*="/app/projects/"]').first();
  if (await projectCard.count() > 0) {
    await projectCard.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Clicked on project');
  } else {
    console.log('❌ No project cards found');
    await page.screenshot({ path: '/tmp/debug-no-projects.png', fullPage: true });
  }
  
  // Wait for and click on Capacity Visualizer tab
  await page.waitForSelector('text=Capacity Visualizer', { timeout: 10000 });
  await page.click('text=Capacity Visualizer');
  await page.waitForTimeout(2000);
  console.log('✅ Clicked on Capacity Visualizer tab');
  
  // Take full page screenshot
  await page.screenshot({ path: '/tmp/debug-full-page.png', fullPage: true });
  console.log('📸 Full page screenshot taken');
  
  // Scroll down to find the canvas
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/debug-scrolled-down.png', fullPage: true });
  console.log('📸 Scrolled down screenshot taken');
  
  // Look for SVG elements
  const svgs = await page.locator('svg').all();
  console.log(`📊 Found ${svgs.length} SVG elements`);
  
  for (let i = 0; i < Math.min(svgs.length, 5); i++) {
    const svg = svgs[i];
    const bbox = await svg.boundingBox();
    console.log(`SVG ${i}: ${bbox ? `${bbox.width}x${bbox.height} at (${bbox.x}, ${bbox.y})` : 'no bbox'}`);
    
    // Take screenshot of each significant SVG
    if (bbox && bbox.width > 100 && bbox.height > 100) {
      await svg.screenshot({ path: `/tmp/debug-svg-${i}.png` });
      console.log(`📸 SVG ${i} screenshot taken`);
      
      // Check for specific elements within this SVG
      const rects = await svg.locator('rect').count();
      const texts = await svg.locator('text').count();
      const foreignObjects = await svg.locator('foreignObject').count();
      
      console.log(`  SVG ${i} contains: ${rects} rects, ${texts} texts, ${foreignObjects} foreignObjects`);
      
      // Check for cluster rectangles (dark background)
      const clusterRects = await svg.locator('rect[fill="#36404a"]').count();
      console.log(`  Cluster rectangles: ${clusterRects}`);
      
      // Check for host rectangles
      const hostRects = await svg.locator('rect[fill*="rgba(139, 92, 246, 0.3)"]').count();
      console.log(`  Host rectangles: ${hostRects}`);
      
      // Check for VM rectangles  
      const vmRects = await svg.locator('rect[fill*="rgba(99, 102, 241, 0.6)"]').count();
      console.log(`  VM rectangles: ${vmRects}`);
      
      // Check for text elements
      const hostTexts = await svg.locator('text.host-name-text').count();
      const vmTexts = await svg.locator('text.vm-text').count();
      const percentTexts = await svg.locator('text.cluster-percentage-text').count();
      
      console.log(`  Text elements: ${hostTexts} host names, ${vmTexts} VM names, ${percentTexts} percentages`);
      
      // Test clicking on host rectangles if they exist
      if (hostRects > 0) {
        console.log('🖱️ Testing host click for zoom...');
        await svg.locator('rect[fill*="rgba(139, 92, 246, 0.3)"]').first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `/tmp/debug-after-host-click-${i}.png`, fullPage: true });
        console.log('📸 After host click screenshot taken');
        
        // Click again to zoom out
        await svg.locator('rect[fill*="rgba(139, 92, 246, 0.3)"]').first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `/tmp/debug-after-zoom-out-${i}.png`, fullPage: true });
        console.log('📸 After zoom out screenshot taken');
      }
    }
  }
  
  console.log('✅ Canvas debug test completed');
});