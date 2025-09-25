import { test, expect, Page } from '@playwright/test';

test('Debug DOM State and CSS Properties', async ({ page }) => {
  console.log('\n🔬 DOM DEBUG: Capacity Visualizer CSS and Visibility');
  
  // Navigate to projects and capacity tab
  await page.goto('/app/projects');
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
  await capacityTab.click();
  await page.waitForTimeout(3000);
  
  // Debug DOM structure and CSS
  const domDebug = await page.evaluate(() => {
    // Find elements containing capacity visualizer content
    const capacityText = Array.from(document.querySelectorAll('*'))
      .find(el => el.textContent?.includes('Interactive Capacity Visualizer'));
    
    if (capacityText) {
      const container = capacityText.closest('div');
      const computedStyle = container ? window.getComputedStyle(container) : null;
      
      return {
        found: true,
        containerTag: container?.tagName,
        display: computedStyle?.display,
        visibility: computedStyle?.visibility,
        opacity: computedStyle?.opacity,
        height: computedStyle?.height,
        minHeight: computedStyle?.minHeight,
        overflow: computedStyle?.overflow,
        position: computedStyle?.position,
        zIndex: computedStyle?.zIndex,
        transform: computedStyle?.transform,
        parentDisplay: container?.parentElement ? window.getComputedStyle(container.parentElement).display : null,
        boundingRect: container?.getBoundingClientRect()
      };
    }
    
    return { found: false };
  });
  
  console.log('Capacity Visualizer Container CSS:', domDebug);
  
  // Check SVG elements specifically
  const svgDebug = await page.evaluate(() => {
    const svgs = document.querySelectorAll('svg');
    if (svgs.length > 0) {
      const firstSvg = svgs[0];
      const style = window.getComputedStyle(firstSvg);
      return {
        count: svgs.length,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: style.width,
        height: style.height,
        boundingRect: firstSvg.getBoundingClientRect()
      };
    }
    return { count: 0 };
  });
  
  console.log('SVG Elements Debug:', svgDebug);
  
  // Check tab content container
  const tabContentDebug = await page.evaluate(() => {
    const tabContainer = document.querySelector('[role="tablist"]')?.parentElement;
    const contentArea = tabContainer?.nextElementSibling;
    
    if (contentArea) {
      const style = window.getComputedStyle(contentArea);
      return {
        tag: contentArea.tagName,
        display: style.display,
        height: style.height,
        minHeight: style.minHeight,
        boundingRect: contentArea.getBoundingClientRect()
      };
    }
    return null;
  });
  
  console.log('Tab Content Area Debug:', tabContentDebug);
  
  // Force visibility by removing any problematic styles
  await page.evaluate(() => {
    const capacityElements = Array.from(document.querySelectorAll('*'))
      .filter(el => el.textContent?.includes('Interactive Capacity Visualizer') || 
                    el.textContent?.includes('Capacity Visualizer'));
    
    capacityElements.forEach(el => {
      const element = el as HTMLElement;
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      element.style.display = 'block';
      element.style.minHeight = '600px';
      
      // Also fix parent containers
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        parent.style.visibility = 'visible';
        parent.style.opacity = '1';
        if (parent.style.display === 'none') {
          parent.style.display = 'block';
        }
        parent = parent.parentElement;
      }
    });
    
    console.log('Applied visibility fixes to capacity visualizer elements');
  });
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/dom-debug-after-fixes.png', fullPage: true });
  
  console.log('🔬 DOM DEBUG Complete');
});