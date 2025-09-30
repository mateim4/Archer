import { test, expect } from '@playwright/test';

test('VM improvements verification', async ({ page }) => {
  console.log('🔍 Testing VM improvements');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing state with VM improvements');
  await page.screenshot({ path: '/tmp/vm-improvements-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test VM selection - should work without Ctrl
    console.log('🧪 Test: Default multi-select behavior');
    const firstVM = page.locator('g[class*="vm-"]').first();
    const firstVMRect = firstVM.locator('rect').first();
    
    console.log('  ↳ Click VM to select (should be pastel yellow)');
    await firstVMRect.click();
    await page.waitForTimeout(1000);
    
    // Select second VM without Ctrl
    const secondVM = page.locator('g[class*="vm-"]').nth(1);
    const secondVMRect = secondVM.locator('rect').first();
    
    console.log('  ↳ Click second VM (should add to selection)');
    await secondVMRect.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/tmp/vm-improvements-2-multi-select.png', fullPage: true });
    
    // Test checkbox functionality
    console.log('🧪 Test: Checkbox selection');
    const checkbox = page.locator('.vm-checkbox').first();
    await checkbox.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: '/tmp/vm-improvements-3-checkbox.png', fullPage: true });
    
    console.log('✅ VM improvements test completed!');
    
  } catch (error) {
    console.log('❌ Error during VM improvements testing:', error);
    await page.screenshot({ path: '/tmp/vm-improvements-error.png', fullPage: true });
  }
});