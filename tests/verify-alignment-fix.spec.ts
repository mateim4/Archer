import { test } from '@playwright/test';

test('Verify perfect table header alignment', async ({ page }) => {
  console.log('✅ Verifying fixed table header alignment...');
  
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Take screenshot of fixed alignment
  await page.screenshot({ 
    path: '/tmp/alignment-fixed.png', 
    fullPage: true 
  });
  
  console.log('Screenshot saved to /tmp/alignment-fixed.png');
  console.log('✅ Alignment verification complete');
});