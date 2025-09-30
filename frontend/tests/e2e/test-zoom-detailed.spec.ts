import { test, expect } from '@playwright/test';

test('Detailed Zoom Test with Scrolling', async ({ page }) => {
  console.log('🔍 Starting detailed zoom test');
  
  await page.setViewportSize({ width: 1600, height: 1200 });
  
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Scroll down to the canvas
  await page.evaluate(() => {
    const canvas = document.querySelector('[role="tabpanel"]');
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Take screenshot before zoom
  await page.screenshot({ path: 'test-results/before-zoom-scroll.png', fullPage: true });
  
  // Get initial state
  const beforeZoom = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG' };
    
    const clusterNames = svg.querySelectorAll('.cluster-name-text');
    const clusterPercent = svg.querySelectorAll('.cluster-percentage-text');
    const hostNames = svg.querySelectorAll('.host-name-text');
    
    return {
      clusterNames: clusterNames.length,
      clusterPercent: clusterPercent.length,
      hostNames: hostNames.length,
      svgBounds: svg.getBoundingClientRect()
    };
  });
  
  console.log('Before zoom:', JSON.stringify(beforeZoom, null, 2));
  
  // Click on first host
  const clickResult = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG found' };
    
    // Find all rectangles
    const allRects = svg.querySelectorAll('rect');
    console.log('Total rectangles:', allRects.length);
    
    // Look for host rectangles (depth 1) - they have pointer cursor
    let hostRect: Element | null = null;
    for (const rect of Array.from(allRects)) {
      const style = window.getComputedStyle(rect);
      if (style.cursor === 'pointer') {
        // Check if it's a host (not a VM)
        const width = parseFloat(rect.getAttribute('width') || '0');
        if (width > 100) { // Hosts are wider than VMs
          hostRect = rect;
          break;
        }
      }
    }
    
    if (!hostRect) {
      return { error: 'No host rect found', totalRects: allRects.length };
    }
    
    // Click it
    const event = new MouseEvent('click', { 
      bubbles: true, 
      cancelable: true,
      view: window 
    });
    hostRect.dispatchEvent(event);
    
    return { success: true, clicked: true };
  });
  
  console.log('Click result:', JSON.stringify(clickResult, null, 2));
  
  // Wait for transition
  await page.waitForTimeout(1000);
  
  // Take screenshot after zoom
  await page.screenshot({ path: 'test-results/after-zoom-scroll.png', fullPage: true });
  
  // Check state after zoom
  const afterZoom = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG' };
    
    const clusterNames = svg.querySelectorAll('.cluster-name-text');
    const clusterPercent = svg.querySelectorAll('.cluster-percentage-text');
    const hostNames = svg.querySelectorAll('.host-name-text');
    
    let clusterNamesVisible = 0;
    let clusterPercentVisible = 0;
    let hostNamesVisible = 0;
    
    clusterNames.forEach(el => {
      const style = window.getComputedStyle(el);
      if (parseFloat(style.opacity) > 0.5) clusterNamesVisible++;
    });
    
    clusterPercent.forEach(el => {
      const style = window.getComputedStyle(el);
      if (parseFloat(style.opacity) > 0.5) clusterPercentVisible++;
    });
    
    hostNames.forEach(el => {
      const style = window.getComputedStyle(el);
      if (parseFloat(style.opacity) > 0.5) hostNamesVisible++;
    });
    
    return {
      totalClusterNames: clusterNames.length,
      visibleClusterNames: clusterNamesVisible,
      totalClusterPercent: clusterPercent.length,
      visibleClusterPercent: clusterPercentVisible,
      totalHostNames: hostNames.length,
      visibleHostNames: hostNamesVisible
    };
  });
  
  console.log('After zoom:', JSON.stringify(afterZoom, null, 2));
  
  // Verify cluster text is hidden
  expect(afterZoom.visibleClusterNames).toBe(0);
  expect(afterZoom.visibleClusterPercent).toBe(0);
  
  // Verify only one host name is visible
  expect(afterZoom.visibleHostNames).toBe(1);
  
  console.log('✅ Zoom test passed!');
});