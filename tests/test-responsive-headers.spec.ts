import { test } from '@playwright/test';

test('Test responsive table header scaling', async ({ page }) => {
  console.log('📏 Testing responsive header scaling...');
  
  // Test at different viewport sizes
  const viewports = [
    { width: 1920, height: 1080, name: 'Full HD' },
    { width: 1366, height: 768, name: 'Laptop' },
    { width: 1024, height: 768, name: 'Tablet' }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('http://localhost:1420/app/capacity-visualizer');
    await page.waitForTimeout(2000);
    
    console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/responsive-${viewport.name.toLowerCase().replace(' ', '-')}.png`, 
      fullPage: true 
    });
    
    // Measure header widths
    const clusterHeader = await page.locator('div:has-text("Storage groups")').boundingBox();
    const hostHeader = await page.locator('div:has-text("Physical servers")').boundingBox();
    const vmHeader = await page.locator('div:has-text("VM workloads")').boundingBox();
    
    console.log(`  Cluster header width: ${clusterHeader?.width}px`);
    console.log(`  Host header width: ${hostHeader?.width}px`);
    console.log(`  VM header width: ${vmHeader?.width}px`);
    
    // Check if rectangles exist and measure them
    const clusterRect = await page.locator('rect[fill="#CDA6FF"]').first().boundingBox();
    const hostRect = await page.locator('rect[fill="#F7AEF8"]').first().boundingBox();
    const vmRect = await page.locator('rect[fill="#D2D4DA"]').first().boundingBox();
    
    if (clusterRect && hostRect && vmRect) {
      console.log(`  Cluster rect width: ${clusterRect.width}px`);
      console.log(`  Host rect width: ${hostRect.width}px`);
      console.log(`  VM rect width: ${vmRect.width}px`);
      
      // Check alignment
      const clusterAligned = Math.abs((clusterHeader?.width || 0) - clusterRect.width) < 5;
      const hostAligned = Math.abs((hostHeader?.width || 0) - hostRect.width) < 5;
      
      console.log(`  ✅ Alignment: Cluster=${clusterAligned}, Host=${hostAligned}`);
    }
  }
  
  console.log('✅ Responsive scaling test complete');
});