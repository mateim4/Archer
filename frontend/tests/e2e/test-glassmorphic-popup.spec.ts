import { test } from '@playwright/test';

test('Test glassmorphic popup for Add New Cluster', async ({ page }) => {
  console.log('🔧 Testing glassmorphic popup');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Screenshot before clicking add cluster
  await page.screenshot({ path: 'test-results/before-add-cluster.png', fullPage: true });
  
  // Click Add New Cluster button
  await page.getByText('Add New Cluster').click();
  await page.waitForTimeout(1000);
  
  // Screenshot showing glassmorphic popup
  await page.screenshot({ path: 'test-results/glassmorphic-popup.png', fullPage: true });
  
  console.log('🔧 Glassmorphic popup test completed');
});