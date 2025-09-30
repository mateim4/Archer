import { test, expect } from '@playwright/test';

test('Test Capacity Visualizer UI Improvements', async ({ page }) => {
  console.log('🔍 Testing Capacity Visualizer UI...');
  
  // Navigate to visualizer
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Check for search bar
  const searchBar = await page.locator('input[placeholder*="Search"]').isVisible();
  console.log(`Search bar visible: ${searchBar}`);
  
  // Check for table headers
  const hasClusterHeader = await page.locator('text=Clusters').isVisible();
  const hasHostHeader = await page.locator('text=Hosts').isVisible(); 
  const hasVMHeader = await page.locator('text=Virtual Machines').isVisible();
  console.log(`Headers - Clusters: ${hasClusterHeader}, Hosts: ${hasHostHeader}, VMs: ${hasVMHeader}`);
  
  // Check SVG canvas
  const svg = await page.locator('svg').first();
  const svgBox = await svg.boundingBox();
  console.log(`SVG dimensions: ${svgBox?.width}x${svgBox?.height}`);
  
  // Test search functionality
  if (searchBar) {
    await page.fill('input[placeholder*="Search"]', 'PROD');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/visualizer-search-prod.png', fullPage: true });
    
    await page.fill('input[placeholder*="Search"]', 'VM-01');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/visualizer-search-vm.png', fullPage: true });
    
    // Clear search
    const clearButton = await page.locator('button:has-text("Clear")').isVisible();
    if (clearButton) {
      await page.click('button:has-text("Clear")');
      console.log('Search cleared');
    }
  }
  
  // Take final screenshot
  await page.screenshot({ path: '/tmp/visualizer-final-ui.png', fullPage: true });
  console.log('✅ UI test complete');
});