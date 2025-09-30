import { test } from '@playwright/test';

test('Test final responsive behavior after fix', async ({ page }) => {
  console.log('🎯 Testing final responsive behavior...');
  
  const viewports = [
    { width: 1920, height: 1080, name: 'Wide' },
    { width: 1366, height: 768, name: 'Medium' },
    { width: 1024, height: 768, name: 'Narrow' }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('http://localhost:1420/app/capacity-visualizer');
    await page.waitForTimeout(3000);
    
    console.log(`Testing ${viewport.name} (${viewport.width}px wide)`);
    
    // Take screenshot of fixed responsive behavior
    await page.screenshot({ 
      path: `/tmp/final-responsive-${viewport.name.toLowerCase()}.png`, 
      fullPage: true 
    });
    
    console.log(`  Screenshot saved: final-responsive-${viewport.name.toLowerCase()}.png`);
  }
  
  console.log('✅ Final responsive test complete');
});