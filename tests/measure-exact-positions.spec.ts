import { test } from '@playwright/test';

test('Measure exact positions for perfect alignment', async ({ page }) => {
  console.log('📏 Measuring exact positions...');
  
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Measure visualizer rectangles
  const clusterRect = await page.locator('rect[fill="#CDA6FF"]').first().boundingBox();
  const hostRect = await page.locator('rect[fill="#F7AEF8"]').first().boundingBox();
  const vmRect = await page.locator('rect[fill="#D2D4DA"]').first().boundingBox();
  
  console.log('Visualizer positions:');
  console.log(`Cluster rect: x=${clusterRect?.x}, width=${clusterRect?.width}`);
  console.log(`Host rect: x=${hostRect?.x}, width=${hostRect?.width}`);
  console.log(`VM rect: x=${vmRect?.x}, width=${vmRect?.width}`);
  
  // Measure current header positions
  const clusterHeaderDiv = await page.locator('div:has-text("Storage groups")').boundingBox();
  const hostHeaderDiv = await page.locator('div:has-text("Physical servers")').boundingBox();
  const vmHeaderDiv = await page.locator('div:has-text("VM workloads")').boundingBox();
  
  console.log('Current header positions:');
  console.log(`Cluster header: x=${clusterHeaderDiv?.x}, width=${clusterHeaderDiv?.width}`);
  console.log(`Host header: x=${hostHeaderDiv?.x}, width=${hostHeaderDiv?.width}`);
  console.log(`VM header: x=${vmHeaderDiv?.x}, width=${vmHeaderDiv?.width}`);
  
  // Calculate alignment offsets needed
  if (clusterRect && clusterHeaderDiv) {
    const clusterOffset = clusterRect.x - clusterHeaderDiv.x;
    console.log(`Cluster needs offset: ${clusterOffset}px`);
  }
  
  if (hostRect && hostHeaderDiv) {
    const hostOffset = hostRect.x - hostHeaderDiv.x;
    console.log(`Host needs offset: ${hostOffset}px`);
  }
  
  if (vmRect && vmHeaderDiv) {
    const vmOffset = vmRect.x - vmHeaderDiv.x;
    console.log(`VM needs offset: ${vmOffset}px`);
  }
  
  // Check SVG container position
  const svgContainer = await page.locator('svg').first().boundingBox();
  console.log(`SVG container: x=${svgContainer?.x}, y=${svgContainer?.y}, width=${svgContainer?.width}, height=${svgContainer?.height}`);
  
  console.log('📐 Measurement complete');
});