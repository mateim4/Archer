import { test, expect } from '@playwright/test';

test('Direct tooltip event triggering', async ({ page }) => {
  console.log('🎯 Testing direct tooltip event');
  
  await page.setViewportSize({ width: 1600, height: 1200 });
  
  // Enable console logging for debugging
  page.on('console', msg => {
    if (msg.text().includes('Using event coordinates') || 
        msg.text().includes('Using tracked mouse position') || 
        msg.text().includes('Using element-based position') ||
        msg.text().includes('Tooltip rendering with data')) {
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
  
  await page.waitForTimeout(1000);
  
  // Directly trigger a mouseover event on a rectangle with specific coordinates
  const result = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG found' };
    
    const rects = svg.querySelectorAll('rect');
    let targetRect: SVGRectElement | null = null;
    
    // Find any rectangle that looks clickable
    const candidates: any[] = [];
    
    for (const rect of Array.from(rects)) {
      const width = parseFloat(rect.getAttribute('width') || '0');
      const height = parseFloat(rect.getAttribute('height') || '0');
      const style = window.getComputedStyle(rect);
      
      candidates.push({
        rect,
        width,
        height,
        cursor: style.cursor,
        fill: rect.getAttribute('fill')
      });
      
      // Try to find a small rectangle first (VMs)
      if (width < 50 && height < 50 && width > 5) {
        targetRect = rect;
        break;
      }
    }
    
    // If no small rectangle found, try medium sized ones (hosts)
    if (!targetRect) {
      for (const rect of Array.from(rects)) {
        const width = parseFloat(rect.getAttribute('width') || '0');
        const height = parseFloat(rect.getAttribute('height') || '0');
        
        if (width > 50 && width < 200 && height > 50 && height < 200) {
          targetRect = rect;
          break;
        }
      }
    }
    
    console.log('Rectangle candidates:', candidates.slice(0, 10));
    
    if (!targetRect) return { error: 'No suitable rectangle found' };
    
    const rectBounds = targetRect.getBoundingClientRect();
    const mouseX = rectBounds.left + rectBounds.width / 2;
    const mouseY = rectBounds.top + rectBounds.height / 2;
    
    // Create and dispatch mouseover event with explicit coordinates
    const mouseEvent = new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      clientX: mouseX,
      clientY: mouseY,
      pageX: mouseX,
      pageY: mouseY,
      screenX: mouseX,
      screenY: mouseY
    });
    
    console.log('Dispatching mouseover event with coordinates:', { mouseX, mouseY });
    
    // Dispatch the event
    targetRect.dispatchEvent(mouseEvent);
    
    // Wait a bit for tooltip to appear
    return new Promise(resolve => {
      setTimeout(() => {
        // Look specifically for our capacity tooltip using the data-testid
        let capacityTooltip = document.querySelector('[data-testid="capacity-tooltip"]') as HTMLElement;
        
        // Fallback: if not found by testid, use the improved detection
        if (!capacityTooltip) {
          const allTooltips = document.querySelectorAll('[style*="position: fixed"]');
          
          for (const tooltip of Array.from(allTooltips)) {
            const element = tooltip as HTMLElement;
            const content = element.textContent || '';
            const computedStyle = window.getComputedStyle(element);
            
            // Look for our specific tooltip styling characteristics:
            const hasCapacityTooltipStyle = (
              computedStyle.maxWidth === '280px' ||
              computedStyle.backdropFilter?.includes('blur') ||
              element.style.transform?.includes('translateX') ||
              (parseFloat(element.style.left || '0') > 400 && parseFloat(element.style.top || '0') > 400)
            );
            
            const hasRelevantContent = (
              content.includes('vCPU') || content.includes('Memory') || content.includes('Storage') || 
              content.includes('CPU Cores') || content.includes('VMs') || content.includes('GB')
            );
            
            if (hasCapacityTooltipStyle || hasRelevantContent) {
              capacityTooltip = element;
              console.log('Found capacity tooltip via fallback:', {
                content: content.substring(0, 50),
                style: element.style.cssText,
                maxWidth: computedStyle.maxWidth,
                backdropFilter: computedStyle.backdropFilter,
                position: { left: element.style.left, top: element.style.top }
              });
              break;
            }
          }
        } else {
          console.log('Found capacity tooltip via testid');
        }
        
        if (!capacityTooltip) {
          resolve({ 
            success: false, 
            mouseX, 
            mouseY, 
            error: 'No capacity visualizer tooltip found after event dispatch',
            allTooltips: Array.from(allTooltips).map(t => ({
              content: (t as HTMLElement).textContent?.substring(0, 100),
              style: (t as HTMLElement).style.cssText
            }))
          });
          return;
        }
        
        const tooltipRect = capacityTooltip.getBoundingClientRect();
        resolve({
          success: true,
          mouseX,
          mouseY,
          tooltip: {
            left: capacityTooltip.style.left,
            top: capacityTooltip.style.top,
            computedLeft: tooltipRect.left,
            computedTop: tooltipRect.top,
            content: capacityTooltip.textContent?.substring(0, 100)
          },
          distance: Math.sqrt(
            Math.pow(tooltipRect.left - mouseX, 2) + 
            Math.pow(tooltipRect.top - mouseY, 2)
          )
        });
      }, 500);
    });
  });
  
  console.log('Direct event result:', JSON.stringify(result, null, 2));
  
  if ((result as any).success) {
    const data = result as any;
    console.log(`✅ Tooltip appeared at: ${data.tooltip.computedLeft}, ${data.tooltip.computedTop}`);
    console.log(`Mouse was at: ${data.mouseX}, ${data.mouseY}`);
    console.log(`Distance: ${data.distance}px`);
    
    // Tooltip should be within reasonable distance
    expect(data.distance).toBeLessThan(200);
  } else {
    console.log(`❌ ${(result as any).error}`);
    throw new Error((result as any).error);
  }
  
  await page.screenshot({ path: 'test-results/tooltip-direct-test.png', fullPage: true });
});