import { test, expect } from '@playwright/test';

test('Verify cluster spacing with multiple clusters enabled', async ({ page }) => {
  console.log('📏 Testing cluster vertical spacing');
  
  await page.setViewportSize({ width: 1600, height: 1200 });
  
  await page.goto('/app/projects');
  await page.waitForTimeout(1000);
  await page.getByText('Cloud Migration Project').click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Capacity Visualizer' }).click();
  await page.waitForTimeout(3000);
  
  // Make sure both clusters are enabled
  const productionCluster = page.getByText('Production Cluster (6 Hosts)');
  const devCluster = page.getByText('Development Cluster (2 Hosts)');
  
  // Click both clusters to ensure they're visible
  await productionCluster.click();
  await page.waitForTimeout(500);
  await devCluster.click();
  await page.waitForTimeout(1500);
  
  // Check cluster positioning and spacing
  const clusterInfo = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll('svg')).find(s => 
      s.getAttribute('width') === '100%' && s.getAttribute('height') === '100%'
    );
    
    if (!svg) return { error: 'No SVG found' };
    
    // Find all cluster background rectangles (should be charcoal grey)
    const clusterGroups = Array.from(svg.querySelectorAll('g'))
      .filter(g => {
        const rect = g.querySelector('rect[fill*="#4"]') || g.querySelector('rect[fill*="rgb(66"]');
        return rect && rect.getAttribute('width') === '100%' || parseFloat(rect?.getAttribute('width') || '0') > 800;
      });
    
    const clusterPositions = clusterGroups.map((group, index) => {
      const rect = group.querySelector('rect');
      if (!rect) return null;
      
      const transform = group.getAttribute('transform');
      const yMatch = transform?.match(/translate\([^,]+,\s*([^)]+)\)/);
      const yOffset = yMatch ? parseFloat(yMatch[1]) : 0;
      
      return {
        index,
        yOffset,
        rectY: parseFloat(rect.getAttribute('y') || '0'),
        finalY: yOffset + parseFloat(rect.getAttribute('y') || '0'),
        rectHeight: parseFloat(rect.getAttribute('height') || '0'),
        transform
      };
    }).filter(Boolean);
    
    // Calculate spacing between clusters
    const spacing = clusterPositions.length > 1 ? 
      clusterPositions[1].finalY - (clusterPositions[0].finalY + clusterPositions[0].rectHeight) : 0;
    
    return {
      clusterCount: clusterPositions.length,
      clusters: clusterPositions,
      spacing: spacing,
      svgViewBox: svg.getAttribute('viewBox')
    };
  });
  
  console.log('Cluster spacing info:', JSON.stringify(clusterInfo, null, 2));
  
  // Verify we have both clusters
  expect(clusterInfo.clusterCount).toBe(2);
  
  // Verify spacing is adequate (should be around 80px)
  expect(clusterInfo.spacing).toBeGreaterThan(50);
  expect(clusterInfo.spacing).toBeLessThan(120);
  
  await page.screenshot({ path: 'test-results/cluster-spacing-test.png', fullPage: true });
  
  console.log(`✅ Cluster spacing verified: ${clusterInfo.spacing}px between clusters`);
});