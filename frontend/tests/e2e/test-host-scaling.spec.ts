import { test, expect } from '@playwright/test';

test('Check Host Scaling in Development Cluster', async ({ page }) => {
  console.log('🔧 Testing host scaling within clusters');
  
  await page.setViewportSize({ width: 1400, height: 1200 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Scroll to ensure visualization is visible
  await page.evaluate(() => {
    document.querySelector('[role="tabpanel"]')?.scrollIntoView();
  });
  
  await page.waitForTimeout(1000);
  
  // Take full screenshot showing both clusters
  await page.screenshot({ path: 'test-results/host-scaling-check.png', fullPage: true });
  
  // Check if we can find the development cluster elements
  const devClusterText = page.locator('text=Development Cluster');
  if (await devClusterText.count() > 0) {
    console.log('🔧 Found Development Cluster text');
  }
  
  const prodClusterText = page.locator('text=Production Cluster');
  if (await prodClusterText.count() > 0) {
    console.log('🔧 Found Production Cluster text');
  }
  
  console.log('🔧 Host scaling test completed - check screenshot for scaling issues');
});