import { test, expect, Page } from '@playwright/test';

test('Debug Capacity Visualizer Content', async ({ page }) => {
  console.log('\n🔍 DEBUG: Capacity Visualizer Content');
  
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
  
  // Take screenshot before scrolling
  await page.screenshot({ path: 'test-results/debug-before-scroll.png', fullPage: true });
  
  // Scroll down to see if content is below the fold
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/debug-after-scroll.png', fullPage: true });
  
  // Check for specific capacity visualizer text
  const visualizerText = await page.getByText('Interactive Capacity Visualizer').count();
  console.log(`Interactive Capacity Visualizer text found: ${visualizerText}`);
  
  // Check for any error messages
  const errorMessages = await page.locator('.error, [role="alert"]').count();
  console.log(`Error messages found: ${errorMessages}`);
  
  // Check the DOM for the capacity visualizer container
  const capacityContainer = await page.locator('.capacity-visualizer, .lcm-card').count();
  console.log(`Capacity visualizer containers found: ${capacityContainer}`);
  
  // Check browser console for any errors
  let consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  
  await page.waitForTimeout(2000);
  console.log('Console messages:', consoleMessages.slice(-10)); // Last 10 messages
  
  // Check if the component is actually mounted in DOM
  const html = await page.locator('body').innerHTML();
  const hasCapacityContent = html.includes('Interactive Capacity Visualizer') || 
                            html.includes('CapacityVisualizerView') ||
                            html.includes('capacity-visualizer');
  console.log(`Capacity content in DOM: ${hasCapacityContent}`);
  
  // Final full page screenshot
  await page.screenshot({ path: 'test-results/debug-final-state.png', fullPage: true });
  
  console.log('🔍 DEBUG Complete');
});