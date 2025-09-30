import { test, expect } from '@playwright/test';

test('Check Cluster Overlap Issue', async ({ page }) => {
  console.log('🔧 Testing cluster overlap when both clusters are enabled');
  
  await page.setViewportSize({ width: 1400, height: 1200 });
  
  // Navigate to capacity visualizer
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Make sure both clusters are enabled
  const devCheckbox = page.locator('input[type="checkbox"]').first();
  const prodCheckbox = page.locator('input[type="checkbox"]').last();
  
  // Ensure both are checked
  if (!(await devCheckbox.isChecked())) {
    await devCheckbox.check();
  }
  if (!(await prodCheckbox.isChecked())) {
    await prodCheckbox.check();
  }
  
  await page.waitForTimeout(2000);
  
  // Scroll to ensure visualization is visible
  await page.evaluate(() => {
    document.querySelector('[role="tabpanel"]')?.scrollIntoView();
  });
  
  await page.waitForTimeout(1000);
  
  // Collect console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log('Browser console:', text);
  });
  
  // Wait a bit more to see console logs
  await page.waitForTimeout(2000);
  
  // Get all SVG elements and their contexts
  const allSvgInfo = await page.evaluate(() => {
    const allSVGs = document.querySelectorAll('svg');
    const svgData = [];
    
    allSVGs.forEach((svg, index) => {
      svgData.push({
        index,
        viewBox: svg.getAttribute('viewBox'),
        width: svg.getAttribute('width'),
        height: svg.getAttribute('height'),
        className: svg.className.baseVal || '',
        parent: svg.parentElement?.tagName || 'unknown',
        parentClass: svg.parentElement?.className || '',
        innerHTML: svg.innerHTML.substring(0, 200) // First 200 chars
      });
    });
    
    return { totalSVGs: allSVGs.length, svgData };
  });
  
  console.log('All SVGs found:', JSON.stringify(allSvgInfo, null, 2));

  // Get comprehensive layout information
  const clusterInfo = await page.evaluate(() => {
    // Check container dimensions first
    const canvasContainer = document.querySelector('.canvasContainer') || 
                           document.querySelector('[class*="canvasContainer"]') ||
                           document.querySelector('div[style*="position: relative"]');
    
    const containerInfo = canvasContainer ? {
      width: canvasContainer.getBoundingClientRect().width,
      height: canvasContainer.getBoundingClientRect().height,
      computed: {
        width: getComputedStyle(canvasContainer).width,
        height: getComputedStyle(canvasContainer).height,
        minHeight: getComputedStyle(canvasContainer).minHeight
      }
    } : { error: 'No container found' };
    
    const svg = document.querySelector('svg');
    if (!svg) return { containerInfo, error: 'No SVG found' };
    
    const svgInfo = {
      viewBox: svg.getAttribute('viewBox'),
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      boundingRect: {
        width: svg.getBoundingClientRect().width,
        height: svg.getBoundingClientRect().height
      }
    };
    
    // Look for the CapacityCanvas SVG (not Fluent UI icons)
    const capacitySvg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%' && 
      s.innerHTML.includes('translate')
    );
    
    if (!capacitySvg) return { svgInfo, containerInfo, error: 'No capacity SVG found' };
    
    const allClusters = capacitySvg.querySelectorAll('g[transform*="translate(0"]');
    
    const clusterData = [];
    allClusters.forEach((cluster, index) => {
      const transform = cluster.getAttribute('transform') || '';
      const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
      
      if (translateMatch) {
        const x = parseFloat(translateMatch[1]);
        const y = parseFloat(translateMatch[2]);
        
        // Get cluster rectangles within this group
        const rects = cluster.querySelectorAll('rect');
        const clusterRect = rects[0]; // First rect should be cluster background
        
        if (clusterRect) {
          clusterData.push({
            index,
            translateX: x,
            translateY: y,
            rectX: parseFloat(clusterRect.getAttribute('x') || '0'),
            rectY: parseFloat(clusterRect.getAttribute('y') || '0'),
            rectWidth: parseFloat(clusterRect.getAttribute('width') || '0'),
            rectHeight: parseFloat(clusterRect.getAttribute('height') || '0'),
            totalRects: rects.length
          });
        }
      }
    });
    
    return {
      containerInfo,
      svgInfo,
      clusters: clusterData,
      totalClusters: allClusters.length
    };
  });

  console.log('Console messages:', consoleMessages);
  console.log('Cluster layout info:', JSON.stringify(clusterInfo, null, 2));
  
  // Take full screenshot showing overlap issue
  await page.screenshot({ path: 'test-results/cluster-overlap-debug.png', fullPage: true });
  
  console.log('🔧 Cluster overlap test completed - check screenshot and console output');
});