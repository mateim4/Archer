import { test } from '@playwright/test';

test('Test responsive scaling at different widths', async ({ page }) => {
  console.log('📱 Testing responsive scaling...');
  
  const viewports = [
    { width: 1920, height: 1080, name: 'Wide' },
    { width: 1366, height: 768, name: 'Medium' },
    { width: 1024, height: 768, name: 'Narrow' }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('http://localhost:1420/app/capacity-visualizer');
    await page.waitForTimeout(2000);
    
    console.log(`Testing ${viewport.name} (${viewport.width}px wide)`);
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/responsive-${viewport.name.toLowerCase()}.png`, 
      fullPage: true 
    });
    
    // Check if visualizer rectangles exist
    const clusterRect = await page.locator('rect[fill="#CDA6FF"]').first().boundingBox();
    const vmRect = await page.locator('rect[fill="#D2D4DA"]').first().boundingBox();
    
    if (clusterRect && vmRect) {
      console.log(`  Cluster starts at: ${clusterRect.x}px`);
      console.log(`  VMs start at: ${vmRect.x}px`);
      console.log(`  VM width: ${vmRect.width}px`);
    }
  }
  
  console.log('✅ Responsive test complete');
});