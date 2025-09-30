import { test, expect } from '@playwright/test';

test('Debug layout elements', async ({ page }) => {
  console.log('🔍 Debug layout elements');
  
  await page.setViewportSize({ width: 1600, height: 1200 });
  
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Find any elements that might be the control panel
  const elements = await page.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    const results: any[] = [];
    
    allDivs.forEach((div, index) => {
      const classes = div.className;
      const style = window.getComputedStyle(div);
      
      // Look for potential control panel or layout elements
      if (classes && (
        classes.includes('control') || 
        classes.includes('panel') || 
        classes.includes('canvas') ||
        classes.includes('content') ||
        style.display === 'flex'
      )) {
        results.push({
          index,
          className: classes,
          display: style.display,
          flexDirection: style.flexDirection,
          width: div.getBoundingClientRect().width,
          height: div.getBoundingClientRect().height,
          children: div.children.length
        });
      }
    });
    
    return results.slice(0, 20); // First 20 matches
  });
  
  console.log('Found elements:', JSON.stringify(elements, null, 2));
  
  await page.screenshot({ path: 'test-results/layout-debug.png', fullPage: true });
});