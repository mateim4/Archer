import { test } from '@playwright/test';

test('Test responsive hosts spanning cluster width', async ({ page }) => {
  console.log('🔧 Testing responsive host layout');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Screenshot showing responsive hosts layout
  await page.screenshot({ path: 'test-results/responsive-hosts-layout.png', fullPage: true });
  
  console.log('🔧 Responsive hosts test completed');
});