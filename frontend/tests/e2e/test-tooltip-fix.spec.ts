import { test } from '@playwright/test';

test('Test tooltip fix', async ({ page }) => {
  console.log('🔧 Testing tooltip fix');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Screenshot after tooltip fix
  await page.screenshot({ path: 'test-results/tooltip-fix-test.png', fullPage: true });
  
  console.log('🔧 Tooltip fix test completed');
});