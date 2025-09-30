import { test, expect, Page } from '@playwright/test';

test('Test New Icicle Implementation', async ({ page }) => {
  console.log('\n🎯 TESTING NEW ICICLE IMPLEMENTATION');
  
  // Capture console logs for debugging
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'log' && msg.text().includes('🎯')) {
      consoleLogs.push(msg.text());
      console.log('BROWSER LOG:', msg.text());
    }
  });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  
  const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
  await capacityTab.click();
  await page.waitForTimeout(4000); // Wait for rendering
  
  // Take screenshot of the new visualization
  await page.screenshot({ path: '/tmp/new-icicle-full.png', fullPage: true });
  console.log('📸 Full page screenshot taken');
  
  // Find and analyze SVG elements
  const svgs = await page.locator('svg').all();
  console.log(`Found ${svgs.length} SVG elements`);
  
  for (let i = 0; i < svgs.length; i++) {
    const svg = svgs[i];
    const bbox = await svg.boundingBox();
    if (bbox && bbox.width > 100 && bbox.height > 100) {
      console.log(`SVG ${i}: ${bbox.width}x${bbox.height} at (${bbox.x}, ${bbox.y})`);
      
      // Take focused screenshot of this SVG
      await svg.screenshot({ path: `/tmp/new-icicle-svg-${i}.png` });
      
      // Count elements
      const rects = await svg.locator('rect').count();
      const texts = await svg.locator('text').count();
      const icons = await svg.locator('foreignObject').count();
      
      console.log(`  Content: ${rects} rects, ${texts} texts, ${icons} icons`);
      
      // Test zoom by clicking rectangles
      if (rects > 5) {
        console.log(`  Testing zoom functionality...`);
        
        const clickableRects = await svg.locator('rect').all();
        if (clickableRects.length > 0) {
          await clickableRects[0].click();
          await page.waitForTimeout(1000);
          await svg.screenshot({ path: `/tmp/new-icicle-svg-${i}-zoomed.png` });
          console.log(`  📸 Zoomed state captured`);
          
          // Click background to zoom out
          await svg.click();
          await page.waitForTimeout(1000);
          await svg.screenshot({ path: `/tmp/new-icicle-svg-${i}-unzoomed.png` });
          console.log(`  📸 Unzoomed state captured`);
        }
      }
    }
  }
  
  // Analyze console logs
  console.log('\\n📊 CONSOLE ANALYSIS:');
  consoleLogs.forEach(log => console.log(`  ${log}`));
  
  console.log('\\n✅ NEW ICICLE TEST COMPLETE');
});