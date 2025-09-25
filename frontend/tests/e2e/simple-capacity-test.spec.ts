import { test, expect, Page } from '@playwright/test';

test('Simple Capacity Tab Test', async ({ page }) => {
  console.log('\n🎯 SIMPLE: Capacity Tab Test');
  
  // Navigate to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  // Click on Cloud Migration Project
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Take before screenshot
  await page.screenshot({ path: 'test-results/simple-before-capacity-click.png', fullPage: true });
  
  // Click on Capacity tab
  const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
  await capacityTab.click();
  await page.waitForTimeout(5000); // Give more time for rendering
  
  // Take after screenshot
  await page.screenshot({ path: 'test-results/simple-after-capacity-click.png', fullPage: true });
  
  // Check for debug content
  const debugTitle = await page.getByText('CAPACITY TAB IS ACTIVE!').count();
  console.log(`Debug title found: ${debugTitle}`);
  
  // Check for visualizer content
  const visualizerTitle = await page.getByText('Interactive Capacity Visualizer').count();
  console.log(`Visualizer title found: ${visualizerTitle}`);
  
  console.log('🎯 SIMPLE Test Complete');
});