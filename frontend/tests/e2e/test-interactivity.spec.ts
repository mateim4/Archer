import { test, expect } from '@playwright/test';

test('Test Capacity Visualizer interactivity', async ({ page }) => {
  console.log('🔧 Testing capacity visualizer interactivity');
  
  // Set larger viewport
  await page.setViewportSize({ width: 1400, height: 1000 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(2000);
  
  // Test control panel visibility
  const controlPanel = page.locator('[class*="controlPanel"]');
  await expect(controlPanel).toBeVisible();
  
  // Test canvas visibility 
  const canvas = page.locator('svg');
  await expect(canvas).toBeVisible();
  
  // Test view mode dropdown
  const viewDropdown = page.getByText('CPU Utilization');
  if (await viewDropdown.isVisible()) {
    await viewDropdown.click();
    await page.waitForTimeout(500);
    // Check if dropdown opened
    const memoryOption = page.getByText('Memory Utilization');
    if (await memoryOption.isVisible()) {
      await memoryOption.click();
      await page.waitForTimeout(1000);
    }
  }
  
  // Screenshot after interaction
  await page.screenshot({ path: 'test-results/capacity-interactivity.png', fullPage: true });
  
  console.log('🔧 Interactivity test completed');
});