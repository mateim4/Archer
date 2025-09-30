import { test } from '@playwright/test';

test('Check current table header alignment issue', async ({ page }) => {
  console.log('📸 Taking screenshot to analyze alignment issue...');
  
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Take full page screenshot
  await page.screenshot({ 
    path: '/tmp/alignment-issue-current.png', 
    fullPage: true 
  });
  
  console.log('Screenshot saved to /tmp/alignment-issue-current.png');
});