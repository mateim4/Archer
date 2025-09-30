import { test } from '@playwright/test';

test('Check table headers alignment and styling', async ({ page }) => {
  console.log('🔍 Checking table headers...');
  
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Take screenshot to see current state
  await page.screenshot({ path: '/tmp/current-table-headers.png', fullPage: true });
  
  // Check header elements
  const clusterHeaders = await page.locator('div:has-text("Clusters")').count();
  const hostHeaders = await page.locator('div:has-text("Hosts")').count();
  const vmHeaders = await page.locator('div:has-text("Virtual Machines")').count();
  
  console.log(`Cluster headers found: ${clusterHeaders}`);
  console.log(`Host headers found: ${hostHeaders}`);
  console.log(`VM headers found: ${vmHeaders}`);
  
  // Check if search bar is properly positioned
  const searchBar = await page.locator('input[placeholder*="Search"]');
  const searchBarVisible = await searchBar.isVisible();
  console.log(`Search bar visible: ${searchBarVisible}`);
  
  if (searchBarVisible) {
    const searchBox = await searchBar.boundingBox();
    console.log(`Search bar position: top=${searchBox?.y}, width=${searchBox?.width}`);
  }
  
  // Check SVG dimensions
  const svg = await page.locator('svg').first();
  const svgBox = await svg.boundingBox();
  console.log(`SVG canvas: ${svgBox?.width}x${svgBox?.height} at y=${svgBox?.y}`);
  
  console.log('Table header analysis complete');
});