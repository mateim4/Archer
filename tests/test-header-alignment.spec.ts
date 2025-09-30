import { test } from '@playwright/test';

test('Test header alignment after fixes', async ({ page }) => {
  console.log('🔧 Testing header alignment fixes...');
  
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Take screenshot to see alignment
  await page.screenshot({ path: '/tmp/header-alignment-test.png', fullPage: true });
  
  // Measure header and visualizer positions
  const clusterHeader = await page.locator('div:has-text("Clusters")').first().boundingBox();
  const hostHeader = await page.locator('div:has-text("Hosts")').first().boundingBox();
  const vmHeader = await page.locator('div:has-text("Virtual Machines")').first().boundingBox();
  
  console.log('Header positions:');
  console.log(`Cluster: x=${clusterHeader?.x}, width=${clusterHeader?.width}`);
  console.log(`Host: x=${hostHeader?.x}, width=${hostHeader?.width}`);
  console.log(`VM: x=${vmHeader?.x}, width=${vmHeader?.width}`);
  
  // Check if visualizer rectangles are visible
  const clusterRects = await page.locator('rect[fill="#CDA6FF"]').count();
  const hostRects = await page.locator('rect[fill="#F7AEF8"]').count();
  const vmRects = await page.locator('rect[fill="#D2D4DA"]').count();
  
  console.log('Visualizer elements:');
  console.log(`Cluster rects: ${clusterRects}`);
  console.log(`Host rects: ${hostRects}`);
  console.log(`VM rects: ${vmRects}`);
  
  if (clusterRects > 0) {
    const firstClusterRect = await page.locator('rect[fill="#CDA6FF"]').first().boundingBox();
    console.log(`First cluster rect: x=${firstClusterRect?.x}, width=${firstClusterRect?.width}`);
  }
  
  console.log('✅ Header alignment test complete');
});