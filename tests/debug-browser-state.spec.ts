import { test } from '@playwright/test';

test('Debug browser state and check for errors', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    console.log(`BROWSER LOG [${msg.type()}]:`, msg.text());
  });
  
  // Listen for errors
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  console.log('🔍 Navigating to localhost:1420...');
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Check if elements exist
  const headerContainer = await page.locator('div:has-text("Clusters"):has-text("Storage groups")').count();
  console.log(`Found ${headerContainer} header containers`);
  
  // Get the actual computed styles
  const clusterHeader = page.locator('div:has-text("Clusters"):has-text("Storage groups")').first();
  const styles = await clusterHeader.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      position: computed.position,
      left: computed.left,
      width: computed.width,
      background: computed.background
    };
  });
  
  console.log('Cluster header computed styles:', styles);
  
  // Take a screenshot
  await page.screenshot({ 
    path: '/tmp/debug_browser_state.png', 
    fullPage: true 
  });
  
  console.log('Screenshot saved for debugging');
});