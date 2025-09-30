import { test } from '@playwright/test';

test('Debug actual calculated values', async ({ page }) => {
  console.log('🔍 Debugging actual calculated values...');
  
  // Capture console logs
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('DEBUG:')) {
      logs.push(msg.text());
      console.log('Browser:', msg.text());
    }
  });
  
  // Test wide viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(2000);
  console.log('Wide viewport logs collected');
  
  // Test narrow viewport  
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(2000);
  console.log('Narrow viewport logs collected');
  
  console.log('All logs:', logs);
});