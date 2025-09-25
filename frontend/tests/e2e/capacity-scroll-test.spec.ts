import { test, expect, Page } from '@playwright/test';

test('Scroll to Find Capacity Visualizer Content', async ({ page }) => {
  console.log('\n📜 SCROLL: Find Capacity Visualizer Content');
  
  // Navigate to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  // Click on Cloud Migration Project
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Click on Capacity tab
  const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
  await capacityTab.click();
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'test-results/scroll-initial.png', fullPage: false });
  
  // Get page dimensions and content height
  const dimensions = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    documentHeight: document.documentElement.scrollHeight,
    scrollTop: window.scrollY
  }));
  
  console.log(`Page dimensions:`, dimensions);
  
  // Scroll down gradually to look for capacity visualizer content
  const scrollSteps = 5;
  const scrollStep = Math.floor(dimensions.documentHeight / scrollSteps);
  
  for (let i = 1; i <= scrollSteps; i++) {
    const scrollPosition = scrollStep * i;
    console.log(`Scrolling to position: ${scrollPosition}`);
    
    await page.evaluate((position) => window.scrollTo(0, position), scrollPosition);
    await page.waitForTimeout(1000);
    
    // Take screenshot at each position
    await page.screenshot({ path: `test-results/scroll-step-${i}.png`, fullPage: false });
    
    // Check for capacity visualizer specific elements at this scroll position
    const elements = await page.evaluate(() => {
      const visualizerTitle = document.querySelector('*')?.textContent?.includes('Interactive Capacity Visualizer') || false;
      const svgElements = document.querySelectorAll('svg').length;
      const controlPanelElements = document.querySelectorAll('select, input[type="number"]').length;
      
      return {
        hasVisualizerTitle: visualizerTitle,
        svgCount: svgElements,
        controlCount: controlPanelElements
      };
    });
    
    console.log(`Step ${i} elements:`, elements);
    
    // If we find substantial capacity visualizer content, take a detailed screenshot
    if (elements.svgCount > 5 || elements.controlCount > 2) {
      console.log(`✅ Found capacity visualizer content at scroll position ${scrollPosition}`);
      await page.screenshot({ path: `test-results/scroll-found-content-${i}.png`, fullPage: true });
      break;
    }
  }
  
  // Scroll to bottom to see everything
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/scroll-bottom.png', fullPage: false });
  
  // Take final full page screenshot
  await page.screenshot({ path: 'test-results/scroll-full-page.png', fullPage: true });
  
  console.log('📜 SCROLL Test Complete');
});