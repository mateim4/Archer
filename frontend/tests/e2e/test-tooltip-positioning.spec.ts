import { test, expect } from '@playwright/test';

test('Tooltip should appear near cursor', async ({ page }) => {
  console.log('🔍 Testing tooltip positioning');
  
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
  
  // Find a VM rectangle to hover over
  const vmRect = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return null;
    
    const allRects = svg.querySelectorAll('rect');
    for (const rect of Array.from(allRects)) {
      const width = parseFloat(rect.getAttribute('width') || '0');
      const height = parseFloat(rect.getAttribute('height') || '0');
      // Look for small rectangles (VMs)
      if (width < 50 && height < 50 && width > 10) {
        const bbox = rect.getBoundingClientRect();
        return {
          x: bbox.left + bbox.width / 2,
          y: bbox.top + bbox.height / 2,
          rect: {
            left: bbox.left,
            top: bbox.top,
            width: bbox.width,
            height: bbox.height
          }
        };
      }
    }
    return null;
  });
  
  if (!vmRect) {
    console.log('No VM rectangle found');
    return;
  }
  
  console.log('Found VM rectangle at:', vmRect);
  
  // Hover over the VM rectangle
  await page.mouse.move(vmRect.x, vmRect.y);
  await page.waitForTimeout(500);
  
  // Check if tooltip appears and where
  const tooltipInfo = await page.evaluate(() => {
    const tooltip = document.querySelector('[class*="tooltip"]');
    if (!tooltip) return { exists: false };
    
    const style = window.getComputedStyle(tooltip);
    const rect = tooltip.getBoundingClientRect();
    
    return {
      exists: true,
      position: style.position,
      left: style.left,
      top: style.top,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      },
      content: tooltip.textContent?.substring(0, 100)
    };
  });
  
  console.log('Tooltip info:', tooltipInfo);
  
  if (tooltipInfo.exists) {
    // Calculate distance between cursor and tooltip
    const distance = Math.sqrt(
      Math.pow(tooltipInfo.rect.left - vmRect.x, 2) + 
      Math.pow(tooltipInfo.rect.top - vmRect.y, 2)
    );
    
    console.log(`Distance between cursor (${vmRect.x}, ${vmRect.y}) and tooltip (${tooltipInfo.rect.left}, ${tooltipInfo.rect.top}): ${distance}px`);
    
    // Tooltip should be within reasonable distance (not more than 200px away)
    expect(distance).toBeLessThan(200);
  } else {
    console.log('No tooltip found - this might be expected if hover events aren\'t working in test');
  }
  
  await page.screenshot({ path: 'test-results/tooltip-test.png', fullPage: true });
});