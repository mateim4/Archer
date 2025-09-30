import { test, expect } from '@playwright/test';

test('Check visualizer rendering and data', async ({ page }) => {
  console.log('🔍 Checking visualizer rendering...');
  
  // Navigate and wait for page load
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Check if SVG canvas is present
  const svgCanvas = await page.locator('svg').first();
  const svgExists = await svgCanvas.count() > 0;
  console.log(`SVG Canvas exists: ${svgExists}`);
  
  if (svgExists) {
    // Get SVG dimensions
    const bbox = await svgCanvas.boundingBox();
    console.log(`SVG dimensions: ${bbox?.width}x${bbox?.height}`);
    
    // Check for any rendered elements
    const rectCount = await page.locator('svg rect').count();
    const textCount = await page.locator('svg text').count();
    const gCount = await page.locator('svg g').count();
    
    console.log(`Found ${rectCount} rectangles, ${textCount} text elements, ${gCount} groups`);
    
    // Check for specific elements
    const clusters = await page.locator('rect[fill*="rgba(99, 102, 241"]').count();
    const hosts = await page.locator('rect[fill*="rgba(139, 92, 246"]').count();
    const vms = await page.locator('rect[fill*="#e0f2fe"]').count();
    
    console.log(`Clusters: ${clusters}, Hosts: ${hosts}, VMs: ${vms}`);
    
    // Check for error messages
    const errorText = await page.locator('text:has-text("No clusters visible")').count();
    if (errorText > 0) {
      console.log('❌ Empty state message found - no data is being displayed');
    }
    
    // Check console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
    // Check if table headers exist
    const tableHeaders = await page.locator('.table-header').count();
    console.log(`Table headers found: ${tableHeaders}`);
    
    // Check for inline checkboxes
    const inlineCheckboxes = await page.locator('.vm-checkbox-inline').count();
    console.log(`Inline VM checkboxes found: ${inlineCheckboxes}`);
  }
  
  // Take diagnostic screenshot
  await page.screenshot({ path: '/tmp/visualizer-diagnostic.png', fullPage: true });
  console.log('Screenshot saved to /tmp/visualizer-diagnostic.png');
});