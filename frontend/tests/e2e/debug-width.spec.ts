import { test, expect } from '@playwright/test';

test('Debug Width Issues', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1200 });
  
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);

  // Add some debugging JavaScript
  const coordinates = await page.evaluate(() => {
    const rects = document.querySelectorAll('svg rect');
    const results = [];
    
    rects.forEach((rect, index) => {
      const x = rect.getAttribute('x');
      const y = rect.getAttribute('y');
      const width = rect.getAttribute('width');
      const height = rect.getAttribute('height');
      
      results.push({
        index,
        x: parseFloat(x || '0'),
        y: parseFloat(y || '0'),
        width: parseFloat(width || '0'),
        height: parseFloat(height || '0'),
        rightEdge: parseFloat(x || '0') + parseFloat(width || '0')
      });
    });
    
    return results;
  });

  console.log('Rectangle coordinates:', JSON.stringify(coordinates, null, 2));
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-width.png', fullPage: true });
});