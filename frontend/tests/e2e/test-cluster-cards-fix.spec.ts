import { test, expect } from '@playwright/test';

test('Check cluster cards fix', async ({ page }) => {
  // Navigate to the project page first
  await page.goto('http://localhost:1420/app/projects/proj-2');
  await page.waitForTimeout(3000);
  
  // Look for capacity visualizer or similar link
  const capacityLink = page.locator('text=Capacity').or(page.locator('text=Visualizer')).or(page.locator('text=visualizer')).first();
  if (await capacityLink.isVisible({ timeout: 2000 })) {
    await capacityLink.click();
    await page.waitForTimeout(3000);
  }
  
  // Take screenshot of current state
  await page.screenshot({ path: '/tmp/cluster_cards_after_fix.png', fullPage: true });
  
  console.log('Screenshot taken after navigation attempt');
});