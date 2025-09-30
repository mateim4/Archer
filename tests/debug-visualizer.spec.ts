import { test } from '@playwright/test';

test('Debug visualizer data', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('Browser log:', msg.text());
    } else if (msg.type() === 'error') {
      console.log('Browser error:', msg.text());
    }
  });
  
  // Navigate to visualizer
  console.log('Navigating to visualizer...');
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Check if state is being passed
  const result = await page.evaluate(() => {
    // Try to access React component props if possible
    const container = document.querySelector('[data-testid="capacity-canvas"]');
    const clusters = document.querySelectorAll('rect[fill*="rgba(99"]');
    const svgs = document.querySelectorAll('svg');
    
    return {
      hasContainer: !!container,
      clusterCount: clusters.length,
      svgCount: svgs.length,
      svgSizes: Array.from(svgs).map(svg => {
        const rect = svg.getBoundingClientRect();
        return `${rect.width}x${rect.height}`;
      }),
      pageTitle: document.title
    };
  });
  
  console.log('Debug result:', result);
  
  // Check for specific elements
  const hasSearchBar = await page.locator('input[placeholder*="Search"]').count();
  const hasHeaders = await page.locator('div:has-text("Clusters")').count();
  const hasVMCheckbox = await page.locator('.vm-checkbox-inline').count();
  
  console.log('Elements found:');
  console.log('- Search bars:', hasSearchBar);
  console.log('- Headers:', hasHeaders); 
  console.log('- VM checkboxes:', hasVMCheckbox);
});