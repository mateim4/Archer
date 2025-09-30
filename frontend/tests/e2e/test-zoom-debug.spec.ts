import { test, expect } from '@playwright/test';

test('Debug Zoom Behavior', async ({ page }) => {
  console.log('🔍 Debugging zoom behavior');
  
  await page.setViewportSize({ width: 1400, height: 1200 });
  
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Get initial state - all text elements
  const beforeZoom = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No capacity SVG found' };
    
    const allText = svg.querySelectorAll('text');
    const textData: any[] = [];
    
    allText.forEach((text, index) => {
      const style = window.getComputedStyle(text);
      textData.push({
        index,
        content: text.textContent?.substring(0, 50),
        x: text.getAttribute('x'),
        y: text.getAttribute('y'),
        opacity: style.opacity,
        visibility: style.visibility
      });
    });
    
    return { totalText: allText.length, textData };
  });
  
  console.log('Before zoom:', JSON.stringify(beforeZoom, null, 2));
  
  // Click on the first host to zoom
  await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return;
    
    // Find first host rectangle (depth 1)
    const allRects = svg.querySelectorAll('rect');
    const hostRect = Array.from(allRects).find((rect: any) => {
      const parent = rect.parentElement;
      return rect.getAttribute('cursor') === 'pointer' || 
             window.getComputedStyle(rect).cursor === 'pointer';
    });
    
    if (hostRect) {
      (hostRect as any).click();
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Get state after zoom
  const afterZoom = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No capacity SVG found' };
    
    const allText = svg.querySelectorAll('text');
    const textData: any[] = [];
    
    allText.forEach((text, index) => {
      const style = window.getComputedStyle(text);
      textData.push({
        index,
        content: text.textContent?.substring(0, 50),
        x: text.getAttribute('x'),
        y: text.getAttribute('y'),
        opacity: style.opacity,
        visibility: style.visibility
      });
    });
    
    return { totalText: allText.length, textData };
  });
  
  console.log('After zoom:', JSON.stringify(afterZoom, null, 2));
  
  await page.screenshot({ path: 'test-results/zoom-debug.png', fullPage: true });
  
  console.log('🔍 Zoom debug test completed');
});
