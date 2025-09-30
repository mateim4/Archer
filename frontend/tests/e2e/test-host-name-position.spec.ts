import { test, expect } from '@playwright/test';

test('Host name should move to center when zoomed', async ({ page }) => {
  console.log('🔍 Testing host name position during zoom');
  
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
  
  // Get initial host name position
  const beforeZoom = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG' };
    
    const hostNames = svg.querySelectorAll('.host-name-text');
    const firstHostName = hostNames[0];
    
    if (!firstHostName) return { error: 'No host name found' };
    
    return {
      x: firstHostName.getAttribute('x'),
      textContent: firstHostName.textContent,
      textAnchor: firstHostName.getAttribute('text-anchor'),
      opacity: window.getComputedStyle(firstHostName).opacity
    };
  });
  
  console.log('Before zoom - first host name:', beforeZoom);
  
  // Take screenshot before zoom
  await page.screenshot({ path: 'test-results/host-name-before-zoom.png', fullPage: true });
  
  // Click on first host to zoom
  await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return;
    
    const allRects = svg.querySelectorAll('rect');
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
    
    if (hostRect) {
      const event = new MouseEvent('click', { 
        bubbles: true, 
        cancelable: true,
        view: window 
      });
      hostRect.dispatchEvent(event);
    }
  });
  
  // Wait for zoom transition
  await page.waitForTimeout(1000);
  
  // Take screenshot after zoom
  await page.screenshot({ path: 'test-results/host-name-after-zoom.png', fullPage: true });
  
  // Get host name position after zoom
  const afterZoom = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG' };
    
    const svgWidth = svg.getBoundingClientRect().width;
    const hostNames = svg.querySelectorAll('.host-name-text');
    
    // Find the visible host name
    let visibleHostName: Element | null = null;
    for (const hostName of Array.from(hostNames)) {
      const style = window.getComputedStyle(hostName);
      if (parseFloat(style.opacity) > 0.5) {
        visibleHostName = hostName;
        break;
      }
    }
    
    if (!visibleHostName) return { error: 'No visible host name' };
    
    const x = parseFloat(visibleHostName.getAttribute('x') || '0');
    
    return {
      x: visibleHostName.getAttribute('x'),
      xNumeric: x,
      svgWidth: svgWidth,
      expectedCenter: svgWidth / 2,
      textContent: visibleHostName.textContent,
      textAnchor: visibleHostName.getAttribute('text-anchor'),
      opacity: window.getComputedStyle(visibleHostName).opacity,
      isCentered: Math.abs(x - (svgWidth / 2)) < 10 // Within 10px tolerance
    };
  });
  
  console.log('After zoom - visible host name:', afterZoom);
  
  // Verify the host name is centered
  expect(afterZoom.textAnchor).toBe('middle');
  expect(afterZoom.isCentered).toBe(true);
  
  console.log('✅ Host name correctly centered at:', afterZoom.x);
});