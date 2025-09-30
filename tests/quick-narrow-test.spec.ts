import { test } from '@playwright/test';

test('Quick narrow viewport test', async ({ page }) => {
  console.log('📱 Quick narrow viewport test...');
  
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Take screenshot of narrow view
  await page.screenshot({ 
    path: '/tmp/quick-narrow-test.png', 
    fullPage: true 
  });
  
  console.log('Screenshot saved to /tmp/quick-narrow-test.png');
});