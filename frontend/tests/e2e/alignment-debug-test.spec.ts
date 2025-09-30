import { test, expect } from '@playwright/test';

test('Debug alignment issues in detail', async ({ page }) => {
  console.log('🔍 Testing alignment issues with checkboxes and cluster positioning');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state for alignment analysis');
  await page.screenshot({ path: '/tmp/alignment-debug-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test host zoom to reveal checkboxes and check alignment
    console.log('🧪 Test: Host zoom to check checkbox alignment');
    const firstHost = page.locator('g[class*="host-"]').first();
    const hostRect = firstHost.locator('rect').first();
    
    console.log('  ↳ Click host to zoom in and reveal checkboxes');
    await hostRect.click();
    await page.waitForTimeout(2000); // Wait for zoom animation and checkbox creation
    
    console.log('📸 Capturing host zoom with checkboxes for alignment analysis');
    await page.screenshot({ path: '/tmp/alignment-debug-2-host-zoom-checkboxes.png', fullPage: true });
    
    // Check if checkboxes are present
    const checkboxes = page.locator('.zoom-checkbox');
    const checkboxCount = await checkboxes.count();
    console.log(`  ↳ Found ${checkboxCount} checkboxes during host zoom`);
    
    // Zoom out to check general alignment
    console.log('  ↳ Click background to zoom out');
    await svg.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(1000);
    
    console.log('📸 Capturing zoomed out state for cluster alignment analysis');
    await page.screenshot({ path: '/tmp/alignment-debug-3-cluster-alignment.png', fullPage: true });
    
    console.log('✅ Alignment debug test completed!');
    
  } catch (error) {
    console.log('❌ Error during alignment debug testing:', error);
    await page.screenshot({ path: '/tmp/alignment-debug-error.png', fullPage: true });
  }
});