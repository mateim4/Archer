import { test } from '@playwright/test';

test('Verify header alignment at different viewport sizes', async ({ page }) => {
  console.log('📐 Testing header alignment at different viewport sizes...');
  
  // Test wide viewport (1920x1080)
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ 
    path: '/tmp/headers_wide_fixed.png', 
    fullPage: true 
  });
  console.log('Wide viewport screenshot saved');
  
  // Test medium viewport (1440x900)
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: '/tmp/headers_medium_fixed.png', 
    fullPage: true 
  });
  console.log('Medium viewport screenshot saved');
  
  // Test narrow viewport (1024x768)
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(1000);
  
  await page.screenshot({ 
    path: '/tmp/headers_narrow_fixed.png', 
    fullPage: true 
  });
  console.log('Narrow viewport screenshot saved');
  
  console.log('✅ Header alignment verification complete');
});