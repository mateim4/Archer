import { test, expect } from '@playwright/test';

test('Measure actual header and column positions', async ({ page }) => {
  console.log('📏 Measuring actual positions...');
  
  // Test narrow viewport
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(2000);
  
  // Get header positions
  const clusterHeader = await page.locator('div:has-text("Clusters"):has-text("Storage groups")').boundingBox();
  const hostHeader = await page.locator('div:has-text("Hosts"):has-text("Physical servers")').boundingBox();
  const vmHeader = await page.locator('div:has-text("Virtual Machines"):has-text("VM workloads")').boundingBox();
  
  console.log('NARROW VIEWPORT (1024px):');
  console.log(`Cluster Header: left=${clusterHeader?.x}, width=${clusterHeader?.width}`);
  console.log(`Host Header: left=${hostHeader?.x}, width=${hostHeader?.width}`);
  console.log(`VM Header: left=${vmHeader?.x}, width=${vmHeader?.width}`);
  
  // Get SVG column positions
  const svgColumns = await page.evaluate(() => {
    const svg = document.querySelector('svg');
    if (!svg) return null;
    
    // Find the first cluster rect
    const clusterRect = svg.querySelector('.cluster-rect');
    const hostRect = svg.querySelector('.host-rect');
    const vmRect = svg.querySelector('.vm-rect');
    
    const results: any = {};
    
    if (clusterRect) {
      const bbox = (clusterRect as SVGGraphicsElement).getBBox();
      const ctm = (clusterRect as SVGGraphicsElement).getCTM();
      results.cluster = { x: bbox.x + (ctm?.e || 0), width: bbox.width };
    }
    
    if (hostRect) {
      const bbox = (hostRect as SVGGraphicsElement).getBBox();
      const ctm = (hostRect as SVGGraphicsElement).getCTM();
      results.host = { x: bbox.x + (ctm?.e || 0), width: bbox.width };
    }
    
    if (vmRect) {
      const bbox = (vmRect as SVGGraphicsElement).getBBox();
      const ctm = (vmRect as SVGGraphicsElement).getCTM();
      results.vm = { x: bbox.x + (ctm?.e || 0), width: bbox.width };
    }
    
    return results;
  });
  
  console.log(`SVG Cluster Column: left=${svgColumns?.cluster?.x}, width=${svgColumns?.cluster?.width}`);
  console.log(`SVG Host Column: left=${svgColumns?.host?.x}, width=${svgColumns?.host?.width}`);
  console.log(`SVG VM Column: left=${svgColumns?.vm?.x}, width=${svgColumns?.vm?.width}`);
  
  // Test wide viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(2000);
  
  const clusterHeaderWide = await page.locator('div:has-text("Clusters"):has-text("Storage groups")').boundingBox();
  const hostHeaderWide = await page.locator('div:has-text("Hosts"):has-text("Physical servers")').boundingBox();
  const vmHeaderWide = await page.locator('div:has-text("Virtual Machines"):has-text("VM workloads")').boundingBox();
  
  console.log('\nWIDE VIEWPORT (1920px):');
  console.log(`Cluster Header: left=${clusterHeaderWide?.x}, width=${clusterHeaderWide?.width}`);
  console.log(`Host Header: left=${hostHeaderWide?.x}, width=${hostHeaderWide?.width}`);
  console.log(`VM Header: left=${vmHeaderWide?.x}, width=${vmHeaderWide?.width}`);
  
  // Check alignment
  if (clusterHeader && hostHeader && vmHeader) {
    const narrowAlignment = {
      clustersAligned: Math.abs((clusterHeader.x || 0) - (svgColumns?.cluster?.x || 0)) < 5,
      hostsAligned: Math.abs((hostHeader.x || 0) - (svgColumns?.host?.x || 0)) < 5,
      vmsAligned: Math.abs((vmHeader.x || 0) - (svgColumns?.vm?.x || 0)) < 5
    };
    
    console.log('\nALIGNMENT CHECK:');
    console.log(`✓ Clusters aligned: ${narrowAlignment.clustersAligned}`);
    console.log(`✓ Hosts aligned: ${narrowAlignment.hostsAligned}`);
    console.log(`✓ VMs aligned: ${narrowAlignment.vmsAligned}`);
    
    // Assert alignment
    expect(narrowAlignment.clustersAligned).toBe(true);
    expect(narrowAlignment.hostsAligned).toBe(true);
    expect(narrowAlignment.vmsAligned).toBe(true);
  }
});