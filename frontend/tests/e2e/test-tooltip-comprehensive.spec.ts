import { test, expect } from '@playwright/test';

test('Comprehensive tooltip debugging', async ({ page }) => {
  console.log('🔍 Comprehensive tooltip debugging');
  
  await page.setViewportSize({ width: 1600, height: 1200 });
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('Using tracked mouse position') || msg.text().includes('tooltip')) {
      console.log('Browser console:', msg.text());
    }
  });
  
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
  
  // Debug the mouse tracking system
  const mouseTrackingTest = await page.evaluate(() => {
    // First, verify mouse tracking is working
    let mouseEvents = 0;
    const testHandler = (e: MouseEvent) => {
      mouseEvents++;
      console.log(`Mouse tracking test: ${mouseEvents}, coordinates: ${e.clientX}, ${e.clientY}`);
    };
    
    document.addEventListener('mousemove', testHandler);
    
    // Simulate mouse movement
    const event = new MouseEvent('mousemove', {
      clientX: 500,
      clientY: 600,
      bubbles: true
    });
    document.dispatchEvent(event);
    
    document.removeEventListener('mousemove', testHandler);
    
    return {
      mouseEventsReceived: mouseEvents,
      testCoordinates: { x: 500, y: 600 }
    };
  });
  
  console.log('Mouse tracking test result:', mouseTrackingTest);
  
  // Find a VM rectangle and trigger mouseover
  const vmInteraction = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG found' };
    
    const allRects = svg.querySelectorAll('rect');
    let vmRect: SVGRectElement | null = null;
    
    // Find a VM rectangle (should have vm data)
    for (const rect of Array.from(allRects)) {
      const rectData = (rect as any).__data__;
      if (rectData && rectData.data && rectData.data.vmData) {
        vmRect = rect;
        break;
      }
    }
    
    if (!vmRect) {
      // Log available rectangles for debugging
      const rectInfo = Array.from(allRects).slice(0, 10).map((rect, i) => {
        const data = (rect as any).__data__;
        const bounds = rect.getBoundingClientRect();
        return {
          index: i,
          width: bounds.width,
          height: bounds.height,
          dataType: data?.data?.type,
          hasVmData: !!data?.data?.vmData,
          hasHostData: !!data?.data?.hostData,
          depth: data?.depth
        };
      });
      
      return { 
        error: 'No VM rectangle found',
        availableRects: rectInfo
      };
    }
    
    const rectBounds = vmRect.getBoundingClientRect();
    const centerX = rectBounds.left + rectBounds.width / 2;
    const centerY = rectBounds.top + rectBounds.height / 2;
    
    console.log(`Found VM rectangle at: ${centerX}, ${centerY}`);
    
    // Dispatch mouseover event
    const mouseoverEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      clientX: centerX,
      clientY: centerY,
      pageX: centerX,
      pageY: centerY
    });
    
    vmRect.dispatchEvent(mouseoverEvent);
    
    // Wait and check for tooltip
    return new Promise(resolve => {
      setTimeout(() => {
        const tooltip = document.querySelector('[style*="position: fixed"]') as HTMLElement;
        
        resolve({
          success: true,
          mouseCoords: { x: centerX, y: centerY },
          tooltipFound: !!tooltip,
          tooltipStyle: tooltip ? {
            left: tooltip.style.left,
            top: tooltip.style.top,
            position: tooltip.style.position
          } : null,
          tooltipRect: tooltip ? {
            left: tooltip.getBoundingClientRect().left,
            top: tooltip.getBoundingClientRect().top,
            width: tooltip.getBoundingClientRect().width,
            height: tooltip.getBoundingClientRect().height
          } : null
        });
      }, 500);
    });
  });
  
  console.log('VM interaction result:', JSON.stringify(vmInteraction, null, 2));
  
  await page.screenshot({ path: 'test-results/tooltip-comprehensive-debug.png', fullPage: true });
  
  // Additional test: Check if the mouse position ref is being updated
  const mouseRefTest = await page.evaluate(() => {
    // Try to access the component's mouse tracking
    let foundMouseTracking = false;
    
    // Dispatch a mousemove event and see if it triggers console logs
    const mouseMoveEvent = new MouseEvent('mousemove', {
      clientX: 800,
      clientY: 400,
      bubbles: true
    });
    
    document.dispatchEvent(mouseMoveEvent);
    
    return {
      mouseMoveDispatched: true,
      coordinates: { x: 800, y: 400 }
    };
  });
  
  console.log('Mouse ref test:', mouseRefTest);
});