import { test } from '@playwright/test';

test('Debug Console Logs', async ({ page }) => {
  console.log('\n🔍 DEBUGGING CONSOLE LOGS');
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('BROWSER:', msg.text());
    }
    if (msg.type() === 'error') {
      console.log('ERROR:', msg.text());
    }
  });
  
  // Navigate directly to the projects page
  try {
    await page.goto('/app/projects', { waitUntil: 'networkidle' });
    console.log('✅ Reached projects page');
    
    await page.waitForTimeout(2000);
    
    // Try to find and click the project
    const projectElements = await page.locator('*:has-text("Cloud Migration")').all();
    console.log(`Found ${projectElements.length} elements with "Cloud Migration" text`);
    
    if (projectElements.length > 0) {
      await projectElements[0].click();
      console.log('✅ Clicked on project');
      
      await page.waitForTimeout(2000);
      
      // Try to click capacity tab
      const capacityTabs = await page.locator('*:has-text("Capacity")').all();
      console.log(`Found ${capacityTabs.length} elements with "Capacity" text`);
      
      if (capacityTabs.length > 0) {
        await capacityTabs[capacityTabs.length - 1].click(); // Click the last one (likely the tab)
        console.log('✅ Clicked on capacity tab');
        
        await page.waitForTimeout(5000);
      }
    }
  } catch (error) {
    console.log('❌ Navigation error:', error);
  }
  
  console.log('🔍 Debug complete');
});