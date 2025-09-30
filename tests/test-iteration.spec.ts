import { test } from '@playwright/test';

test('Test current iteration', async ({ page }) => {
  console.log('🔧 Testing current alignment iteration...');
  
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Take screenshot of current state
  await page.screenshot({ path: '/tmp/iteration-current.png', fullPage: true });
  
  console.log('Screenshot taken - checking alignment...');
});