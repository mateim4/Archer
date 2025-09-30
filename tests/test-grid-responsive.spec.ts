import { test } from '@playwright/test';

test('Test CSS Grid responsive headers', async ({ page }) => {
  console.log('🏗️ Testing CSS Grid responsive headers...');
  
  const viewports = [
    { width: 1920, height: 1080, name: 'Wide' },
    { width: 1024, height: 768, name: 'Narrow' },
    { width: 800, height: 600, name: 'Tiny' }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('http://localhost:1420/app/capacity-visualizer');
    await page.waitForTimeout(3000);
    
    console.log(`Testing Grid Layout ${viewport.name} (${viewport.width}px)`);
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/grid-responsive-${viewport.name.toLowerCase()}.png`, 
      fullPage: true 
    });
    
    // Check visualizer positions
    const clusterRect = await page.locator('rect[fill="#CDA6FF"]').first().boundingBox();
    const vmRect = await page.locator('rect[fill="#D2D4DA"]').first().boundingBox();
    
    if (clusterRect && vmRect) {
      console.log(`  Visualizer: Cluster=${clusterRect.x}px, VM=${vmRect.x}px, VM width=${vmRect.width}px`);
    }
    
    // Check header positions
    const clusterHeader = await page.locator('div:has-text("Storage groups")').boundingBox();
    const vmHeader = await page.locator('div:has-text("VM workloads")').boundingBox();
    
    if (clusterHeader && vmHeader) {
      console.log(`  Headers: Cluster=${clusterHeader.x}px, VM=${vmHeader.x}px, VM width=${vmHeader.width}px`);
    }
  }
  
  console.log('✅ CSS Grid test complete');
});