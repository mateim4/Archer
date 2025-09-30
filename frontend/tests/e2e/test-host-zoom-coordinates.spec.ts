import { test, expect } from '@playwright/test';

test('Detailed host zoom coordinate analysis', async ({ page }) => {
  console.log('🔍 Analyzing host zoom coordinates');
  
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
  
  await page.waitForTimeout(1000);
  
  // Get initial state
  const beforeZoom = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG' };
    
    // Get first host rectangle and text
    const allRects = svg.querySelectorAll('rect');
    const hostNames = svg.querySelectorAll('.host-name-text');
    
    let hostRect: Element | null = null;
    for (const rect of Array.from(allRects)) {
      const style = window.getComputedStyle(rect);
      if (style.cursor === 'pointer') {
        const width = parseFloat(rect.getAttribute('width') || '0');
        if (width > 100) {
          hostRect = rect;
          break;
        }
      }
    }
    
    const firstHostName = hostNames[0];
    
    return {
      hostRect: hostRect ? {
        x: hostRect.getAttribute('x'),
        width: hostRect.getAttribute('width'),
        name: 'host rectangle'
      } : null,
      hostText: firstHostName ? {
        x: firstHostName.getAttribute('x'),
        content: firstHostName.textContent
      } : null,
      svgDimensions: {
        width: svg.getBoundingClientRect().width,
        height: svg.getBoundingClientRect().height
      }
    };
  });
  
  console.log('Before zoom:', JSON.stringify(beforeZoom, null, 2));
  
  // Click to zoom
  await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return;
    
    const allRects = svg.querySelectorAll('rect');
    for (const rect of Array.from(allRects)) {
      const style = window.getComputedStyle(rect);
      if (style.cursor === 'pointer') {
        const width = parseFloat(rect.getAttribute('width') || '0');
        if (width > 100) {
          const event = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
          rect.dispatchEvent(event);
          break;
        }
      }
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Get state after zoom
  const afterZoom = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG' };
    
    // Find the visible host rectangle (the zoomed one)
    const allRects = svg.querySelectorAll('rect');
    let zoomedRect: Element | null = null;
    
    for (const rect of Array.from(allRects)) {
      const width = parseFloat(rect.getAttribute('width') || '0');
      const x = parseFloat(rect.getAttribute('x') || '0');
      // Zoomed host should be at x=0 and have large width
      if (x === 0 && width > 500) {
        zoomedRect = rect;
        break;
      }
    }
    
    // Find visible host name
    const hostNames = svg.querySelectorAll('.host-name-text');
    let visibleHostName: Element | null = null;
    
    for (const name of Array.from(hostNames)) {
      const style = window.getComputedStyle(name);
      if (parseFloat(style.opacity) > 0.5) {
        visibleHostName = name;
        break;
      }
    }
    
    return {
      zoomedRect: zoomedRect ? {
        x: zoomedRect.getAttribute('x'),
        width: zoomedRect.getAttribute('width'),
        centerShouldBe: parseFloat(zoomedRect.getAttribute('width') || '0') / 2
      } : null,
      visibleHostName: visibleHostName ? {
        x: visibleHostName.getAttribute('x'),
        content: visibleHostName.textContent,
        textAnchor: visibleHostName.getAttribute('text-anchor')
      } : null,
      svgDimensions: {
        width: svg.getBoundingClientRect().width,
        height: svg.getBoundingClientRect().height
      }
    };
  });
  
  console.log('After zoom:', JSON.stringify(afterZoom, null, 2));
  
  if (afterZoom.zoomedRect && afterZoom.visibleHostName) {
    const rectCenter = afterZoom.zoomedRect.centerShouldBe;
    const textX = parseFloat(afterZoom.visibleHostName.x);
    const isAligned = Math.abs(textX - rectCenter) < 5;
    
    console.log(`Rectangle center should be: ${rectCenter}`);
    console.log(`Text position is: ${textX}`);
    console.log(`Are they aligned? ${isAligned}`);
  }
});