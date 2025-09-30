import { test, expect, Page } from '@playwright/test';

test('Comprehensive Current State Analysis', async ({ page }) => {
  console.log('\n🔍 COMPREHENSIVE STATE ANALYSIS');
  
  // Capture console logs for debugging
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'log') {
      consoleLogs.push(msg.text());
    }
  });
  
  // Navigate to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Click on Cloud Migration Project
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Take screenshot of project page
  await page.screenshot({ path: '/tmp/analysis-1-project-page.png', fullPage: true });
  console.log('📸 Captured project page screenshot');
  
  // Click on Capacity tab
  const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
  await capacityTab.click();
  await page.waitForTimeout(5000); // Wait for full rendering
  
  // Take screenshot of capacity visualizer
  await page.screenshot({ path: '/tmp/analysis-2-capacity-visualizer.png', fullPage: true });
  console.log('📸 Captured capacity visualizer screenshot');
  
  // Test zoom functionality
  console.log('\n🔍 TESTING ZOOM FUNCTIONALITY');
  
  // Try clicking on first host rectangle
  const hostRects = await page.locator('rect[fill*="rgba(139, 92, 246"]').all();
  console.log(`Found ${hostRects.length} host rectangles`);
  
  if (hostRects.length > 0) {
    console.log('🖱️ Attempting to click first host rectangle...');
    await hostRects[0].click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: '/tmp/analysis-3-after-host-click.png', fullPage: true });
    console.log('📸 Captured after host click screenshot');
    
    // Try clicking again to test toggle
    await hostRects[0].click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: '/tmp/analysis-4-after-toggle-click.png', fullPage: true });
    console.log('📸 Captured after toggle click screenshot');
  }
  
  // Analyze SVG structure
  console.log('\n🔍 ANALYZING SVG STRUCTURE');
  const svgs = await page.locator('svg').all();
  console.log(`Total SVG elements: ${svgs.length}`);
  
  for (let i = 0; i < Math.min(svgs.length, 3); i++) {
    const svg = svgs[i];
    const bbox = await svg.boundingBox();
    if (bbox && bbox.width > 100 && bbox.height > 100) {
      await svg.screenshot({ path: `/tmp/analysis-svg-${i}-detailed.png` });
      console.log(`📸 Captured detailed SVG ${i} screenshot`);
      
      // Analyze elements within this SVG
      const rects = await svg.locator('rect').count();
      const texts = await svg.locator('text').count();
      const icons = await svg.locator('foreignObject').count();
      
      console.log(`SVG ${i}: ${rects} rectangles, ${texts} texts, ${icons} icons`);
    }
  }
  
  console.log('\n📋 ANALYSIS COMPLETE - Check screenshots in /tmp/');
});