import { test } from '@playwright/test';

test('Test aggressive header re-rendering fix', async ({ page }) => {
  console.log('💪 Testing aggressive header re-rendering fix...');
  
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Test multiple viewport changes rapidly
  const viewports = [
    { width: 1920, height: 1080, name: 'Wide' },
    { width: 1024, height: 768, name: 'Narrow' },
    { width: 1366, height: 768, name: 'Medium' },
    { width: 800, height: 600, name: 'Tiny' }
  ];
  
  for (let i = 0; i < viewports.length; i++) {
    const viewport = viewports[i];
    await page.setViewportSize(viewport);
    await page.waitForTimeout(2000); // Give time for resize to trigger
    
    console.log(`Testing ${viewport.name} (${viewport.width}px)`);
    
    // Take screenshot
    await page.screenshot({ 
      path: `/tmp/aggressive-fix-${viewport.name.toLowerCase()}.png`, 
      fullPage: true 
    });
    
    // Log what we see
    const clusterRect = await page.locator('rect[fill="#CDA6FF"]').first().boundingBox();
    const vmRect = await page.locator('rect[fill="#D2D4DA"]').first().boundingBox();
    
    if (clusterRect && vmRect) {
      console.log(`  Cluster at: ${clusterRect.x}px, VM at: ${vmRect.x}px, VM width: ${vmRect.width}px`);
    }
  }
  
  console.log('✅ Aggressive fix test complete');
});