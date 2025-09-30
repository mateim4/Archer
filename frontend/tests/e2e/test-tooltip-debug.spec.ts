import { test, expect } from '@playwright/test';

test('Debug tooltip positioning issue', async ({ page }) => {
  console.log('🐛 Debugging tooltip positioning');
  
  await page.setViewportSize({ width: 1600, height: 1200 });
  
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Scroll to canvas
  await page.evaluate(() => {
    const canvas = document.querySelector('[role="tabpanel"]');
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  await page.waitForTimeout(2000);
  
  // Find any rectangle that might trigger a tooltip
  const rectInfo = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG found' };
    
    const svgRect = svg.getBoundingClientRect();
    const allRects = svg.querySelectorAll('rect');
    
    const results: any[] = [];
    allRects.forEach((rect, index) => {
      const rectBounds = rect.getBoundingClientRect();
      const style = window.getComputedStyle(rect);
      
      if (rectBounds.width > 20 && rectBounds.height > 20) { // Skip tiny rectangles
        results.push({
          index,
          bounds: {
            left: rectBounds.left,
            top: rectBounds.top,
            width: rectBounds.width,
            height: rectBounds.height,
            centerX: rectBounds.left + rectBounds.width / 2,
            centerY: rectBounds.top + rectBounds.height / 2
          },
          cursor: style.cursor,
          fill: rect.getAttribute('fill')
        });
      }
    });
    
    return {
      svgBounds: svgRect,
      rectangles: results.slice(0, 5), // First 5 rectangles
      totalRects: allRects.length
    };
  });
  
  console.log('Rectangle info:', JSON.stringify(rectInfo, null, 2));
  
  if (rectInfo.rectangles && rectInfo.rectangles.length > 0) {
    const targetRect = rectInfo.rectangles[0];
    const mouseX = targetRect.bounds.centerX;
    const mouseY = targetRect.bounds.centerY;
    
    console.log(`Moving mouse to: ${mouseX}, ${mouseY}`);
    
    // Move mouse to center of first rectangle
    await page.mouse.move(mouseX, mouseY);
    await page.waitForTimeout(500);
    
    // Check if tooltip appears and where
    const tooltipCheck = await page.evaluate((mouseCoords) => {
      const tooltip = document.querySelector('[style*="position: fixed"]') as HTMLElement;
      
      if (!tooltip || !tooltip.style.left) {
        return { 
          found: false, 
          mouseX: mouseCoords.x, 
          mouseY: mouseCoords.y,
          allFixedElements: document.querySelectorAll('[style*="position: fixed"]').length
        };
      }
      
      const tooltipRect = tooltip.getBoundingClientRect();
      const leftValue = tooltip.style.left;
      const topValue = tooltip.style.top;
      
      return {
        found: true,
        mouseX: mouseCoords.x,
        mouseY: mouseCoords.y,
        tooltip: {
          left: leftValue,
          top: topValue,
          computedLeft: tooltipRect.left,
          computedTop: tooltipRect.top,
          width: tooltipRect.width,
          height: tooltipRect.height
        },
        distance: {
          x: tooltipRect.left - mouseCoords.x,
          y: tooltipRect.top - mouseCoords.y,
          total: Math.sqrt(Math.pow(tooltipRect.left - mouseCoords.x, 2) + Math.pow(tooltipRect.top - mouseCoords.y, 2))
        },
        content: tooltip.textContent?.substring(0, 100)
      };
    }, { x: mouseX, y: mouseY });
    
    console.log('Tooltip check result:', JSON.stringify(tooltipCheck, null, 2));
    
    await page.screenshot({ path: 'test-results/tooltip-debug-with-hover.png', fullPage: true });
    
    if (tooltipCheck.found) {
      console.log(`Tooltip appears at: ${tooltipCheck.tooltip.computedLeft}, ${tooltipCheck.tooltip.computedTop}`);
      console.log(`Mouse was at: ${tooltipCheck.mouseX}, ${tooltipCheck.mouseY}`);
      console.log(`Distance: ${tooltipCheck.distance.total}px`);
      
      // If tooltip is more than 200px away from cursor, that's a problem
      if (tooltipCheck.distance.total > 200) {
        console.log('⚠️  TOOLTIP TOO FAR FROM CURSOR!');
      } else {
        console.log('✅ Tooltip positioning looks reasonable');
      }
    } else {
      console.log('⚠️  No tooltip found');
    }
  }
});