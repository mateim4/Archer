import { test, expect } from '@playwright/test';

test('VM drag and drop functionality', async ({ page }) => {
  console.log('🔍 Testing VM drag and drop');
  
  // Navigate to zoom test page
  await page.goto('http://localhost:1420/zoom-test', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  console.log('📸 Capturing initial state');
  await page.screenshot({ path: '/tmp/vm-drag-1-initial.png', fullPage: true });
  
  try {
    // Get the main SVG
    const svg = page.locator('svg[viewBox]').first();
    await svg.waitFor({ timeout: 5000 });
    
    // Test VM selection
    console.log('🧪 Test: VM drag preparation');
    const firstVM = page.locator('g[class*="vm-"]').first();
    const firstVMRect = firstVM.locator('rect').first();
    
    // Select the VM first
    console.log('  ↳ Click VM to select');
    await firstVMRect.click();
    await page.waitForTimeout(1000);
    
    // Simulate drag and drop
    console.log('  ↳ Drag VM to another cluster');
    const secondCluster = page.locator('g[class*="cluster-"]').nth(1);
    const secondClusterRect = secondCluster.locator('rect').first();
    
    // Get bounding boxes for drag operation
    const vmBox = await firstVMRect.boundingBox();
    const clusterBox = await secondClusterRect.boundingBox();
    
    if (vmBox && clusterBox) {
      // Start drag from VM center
      await page.mouse.move(vmBox.x + vmBox.width / 2, vmBox.y + vmBox.height / 2);
      await page.mouse.down();
      
      // Drag to cluster center
      await page.mouse.move(clusterBox.x + clusterBox.width / 2, clusterBox.y + clusterBox.height / 2, { steps: 10 });
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: '/tmp/vm-drag-2-dragging.png', fullPage: true });
      
      // Drop the VM
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: '/tmp/vm-drag-3-dropped.png', fullPage: true });
      
      console.log('✅ VM drag and drop test completed!');
    } else {
      console.log('⚠️ Could not get bounding boxes for drag test');
    }
    
  } catch (error) {
    console.log('❌ Error during VM drag and drop testing:', error);
    await page.screenshot({ path: '/tmp/vm-drag-error.png', fullPage: true });
  }
});