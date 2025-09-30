import { test } from '@playwright/test';

test('Check if CapacityCanvas component mounts', async ({ page }) => {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });
  
  console.log('🔍 Checking component mounting...');
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(5000); // Give more time for loading
  
  // Check for any React errors
  console.log('Console errors:', errors);
  
  // Check DOM structure
  const bodyHTML = await page.locator('body').innerHTML();
  const hasCapacityString = bodyHTML.includes('capacity');
  const hasVisualizerString = bodyHTML.includes('visualizer');
  const hasCanvasString = bodyHTML.includes('canvas');
  
  console.log('DOM contains "capacity":', hasCapacityString);
  console.log('DOM contains "visualizer":', hasVisualizerString);
  console.log('DOM contains "canvas":', hasCanvasString);
  
  // Look for React component structure
  const mainContent = await page.locator('main').count();
  const divCount = await page.locator('div').count();
  
  console.log('Main elements:', mainContent);
  console.log('Total divs:', divCount);
  
  // Check for specific visualizer elements
  const hasTitle = await page.locator('text=Interactive Capacity Visualizer').count();
  const hasSubtitle = await page.locator('text=Simulate VM workload migrations').count();
  
  console.log('Has visualizer title:', hasTitle);
  console.log('Has visualizer subtitle:', hasSubtitle);
  
  // Take screenshot
  await page.screenshot({ path: '/tmp/component-mount-debug.png', fullPage: true });
});