import { test, expect, Page } from '@playwright/test';

test('Force Capacity Visualizer Tab State', async ({ page }) => {
  console.log('\n🔧 FORCE: Capacity Visualizer Tab State');
  
  // Navigate to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  // Click on Cloud Migration Project
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Force the activeTab state via JavaScript
  console.log('🔧 Forcing activeTab to "capacity" via JavaScript...');
  await page.evaluate(() => {
    // Try to find React component instance and force state
    const tabContainer = document.querySelector('[role="tablist"]');
    if (tabContainer) {
      console.log('Found tab container, trying to trigger capacity tab...');
    }
    
    // Also try to click the capacity tab directly via DOM
    const capacityTab = Array.from(document.querySelectorAll('[role="tab"]'))
      .find(tab => tab.textContent?.includes('Capacity'));
    if (capacityTab) {
      console.log('Found capacity tab element, clicking...');
      (capacityTab as HTMLElement).click();
    }
  });
  
  await page.waitForTimeout(2000);
  
  // Take screenshot after forced interaction
  await page.screenshot({ path: 'test-results/force-after-js-click.png', fullPage: true });
  
  // Try multiple different selectors for the capacity tab
  const capacitySelectors = [
    '[role="tab"]:has-text("Capacity")',
    '[role="tab"][aria-selected="false"]:has-text("Capacity")',
    'button:has-text("Capacity")',
    '[data-value="capacity"]',
    '[value="capacity"]',
  ];
  
  for (const selector of capacitySelectors) {
    console.log(`Trying selector: ${selector}`);
    const element = page.locator(selector);
    if (await element.count() > 0) {
      console.log(`✅ Found element with selector: ${selector}`);
      await element.first().click();
      await page.waitForTimeout(1500);
      
      // Check if content changed
      const visualizerText = await page.getByText('Interactive Capacity Visualizer').count();
      const overviewText = await page.getByText('Overall Progress').count();
      
      console.log(`After clicking ${selector}:`);
      console.log(`  - Interactive Capacity Visualizer: ${visualizerText}`);
      console.log(`  - Overall Progress: ${overviewText}`);
      
      if (overviewText === 0 && visualizerText > 0) {
        console.log('✅ Success! Content switched to Capacity Visualizer');
        await page.screenshot({ path: `test-results/force-success-${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`, fullPage: true });
        break;
      }
    } else {
      console.log(`❌ No element found with selector: ${selector}`);
    }
  }
  
  // Final screenshot
  await page.screenshot({ path: 'test-results/force-final-state.png', fullPage: true });
  
  console.log('🔧 FORCE Test Complete');
});