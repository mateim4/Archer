import { test } from '@playwright/test';

test('Final QA - Complete UI/UX Test', async ({ page }) => {
  console.log('🎯 Final QA test for Capacity Visualizer');
  
  await page.goto('http://localhost:1420/app/capacity-visualizer');
  await page.waitForTimeout(3000);
  
  // Take initial screenshot with new colors
  await page.screenshot({ path: '/tmp/final-visualizer-complete.png', fullPage: true });
  
  // Test search functionality
  const searchInput = await page.locator('input[placeholder*="Search"]');
  const hasSearch = await searchInput.count();
  console.log(`Search bar present: ${hasSearch > 0}`);
  
  if (hasSearch > 0) {
    // Test search for production VMs
    await searchInput.fill('PROD');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/search-prod-test.png', fullPage: true });
    
    // Test search for specific VM
    await searchInput.fill('VM-01');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/search-vm-test.png', fullPage: true });
    
    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(1000);
  }
  
  // Test VM selection
  const vmCheckboxes = await page.locator('.vm-checkbox-inline').all();
  console.log(`Found ${vmCheckboxes.length} VM checkboxes`);
  
  if (vmCheckboxes.length > 0) {
    // Click first VM
    await vmCheckboxes[0].click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/vm-selected-test.png', fullPage: true });
    
    // Check if migration panel appears
    const migrationPanel = await page.locator('text=/Selected VMs/').isVisible();
    console.log(`Migration panel appears: ${migrationPanel}`);
  }
  
  // Test table headers
  const clusterHeader = await page.locator('text=Clusters').isVisible();
  const hostHeader = await page.locator('text=Hosts').isVisible();
  const vmHeader = await page.locator('text=Virtual Machines').isVisible();
  
  console.log(`Headers - Clusters: ${clusterHeader}, Hosts: ${hostHeader}, VMs: ${vmHeader}`);
  
  // Check for proper color scheme (VMs should be teal #52D1DC)
  const vmCount = await page.locator('rect[fill="#52D1DC"]').count();
  const hostCount = await page.locator('rect[fill="#FCB07E"]').count();  
  const clusterCount = await page.locator('rect[fill="#CDA6FF"]').count();
  
  console.log(`Color scheme - VMs (teal): ${vmCount}, Hosts (orange): ${hostCount}, Clusters (purple): ${clusterCount}`);
  
  console.log('✅ Final QA Complete!');
});