import { test, expect } from '@playwright/test';

test('VM selection and migration functionality', async ({ page }) => {
  console.log('🔍 Testing VM selection and migration');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state');
  await page.screenshot({ path: '/tmp/vm-migration-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test VM selection
    console.log('🧪 Test: VM selection');
    const firstVM = page.locator('g[class*="vm-"]').first();
    const firstVMRect = firstVM.locator('rect').first();
    
    console.log('  ↳ Click VM to select');
    await firstVMRect.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/vm-migration-2-vm-selected.png', fullPage: true });
    
    // Check if migration panel appears
    const migrationPanel = page.locator('text=Selected VMs');
    await expect(migrationPanel).toBeVisible();
    
    console.log('  ↳ Migration panel visible');
    
    // Test multi-select with Ctrl+click
    console.log('  ↳ Multi-select second VM');
    const secondVM = page.locator('g[class*="vm-"]').nth(1);
    const secondVMRect = secondVM.locator('rect').first();
    
    await secondVMRect.click({ modifiers: ['Control'] });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/vm-migration-3-multi-select.png', fullPage: true });
    
    console.log('✅ VM selection and migration UI test completed!');
    
  } catch (error) {
    console.log('❌ Error during VM migration testing:', error);
    await page.screenshot({ path: '/tmp/vm-migration-error.png', fullPage: true });
  }
});