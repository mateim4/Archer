import { test } from '@playwright/test';

test('Debug capacity visualizer click', async ({ page }) => {
  console.log('📸 Testing capacity visualizer tab');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to project detail
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  
  // Screenshot before clicking capacity tab
  await page.screenshot({ path: 'test-results/before-capacity-click.png', fullPage: true });
  
  // Try to click on Capacity Visualizer tab
  const capacityTab = page.getByRole('tab', { name: 'Capacity Visualizer' });
  await capacityTab.click();
  await page.waitForTimeout(3000);
  
  // Screenshot after clicking capacity tab
  await page.screenshot({ path: 'test-results/after-capacity-click.png', fullPage: true });
  
  console.log('📸 Capacity visualizer screenshots saved');
});