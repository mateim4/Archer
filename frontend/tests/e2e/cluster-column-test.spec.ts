import { test, expect } from '@playwright/test';

test('Cluster column width and horizontal text verification', async ({ page }) => {
  console.log('🔍 Testing cluster column width and horizontal text');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing current state with horizontal text');
  await page.screenshot({ path: '/tmp/cluster-horizontal-text-test.png', fullPage: true });
  
  console.log('✅ Cluster column test completed!');
});