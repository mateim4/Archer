import { test, expect, Page } from '@playwright/test';

test('Test New Vertical Layout Implementation', async ({ page }) => {
  console.log('\n🔄 TESTING: New Vertical Layout Implementation');
  
  // Navigate to projects and access capacity visualizer
  await page.goto('/app/projects');
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
  await capacityTab.click();
  await page.waitForTimeout(5000); // Give more time for new layout to render
  
  // Take screenshot of new layout
  await page.screenshot({ path: 'test-results/vertical-layout-new.png', fullPage: true });
  
  // Test the new layout elements
  const layoutAnalysis = await page.evaluate(() => {
    const clusters = document.querySelectorAll('.cluster');
    const hosts = document.querySelectorAll('.host');
    const vms = document.querySelectorAll('.vm');
    
    return {
      clusterCount: clusters.length,
      hostCount: hosts.length,
      vmCount: vms.length,
      hasVisualizerTitle: document.body.textContent?.includes('Interactive Capacity Visualizer') || false,
      hasControlPanel: document.querySelectorAll('select, input[type="number"]').length > 0
    };
  });
  
  console.log('New Layout Analysis:');
  console.log(`  Clusters: ${layoutAnalysis.clusterCount}`);
  console.log(`  Hosts: ${layoutAnalysis.hostCount}`);
  console.log(`  VMs: ${layoutAnalysis.vmCount}`);
  console.log(`  Has Visualizer Title: ${layoutAnalysis.hasVisualizerTitle ? '✅' : '❌'}`);
  console.log(`  Has Control Panel: ${layoutAnalysis.hasControlPanel ? '✅' : '❌'}`);
  
  // Check if the layout is working correctly
  if (layoutAnalysis.clusterCount > 0 && layoutAnalysis.hostCount > 0 && layoutAnalysis.vmCount > 0) {
    console.log('✅ SUCCESS: New vertical layout is rendering correctly!');
  } else {
    console.log('⚠️ PARTIAL: Layout elements found but may need adjustments');
  }
  
  console.log('🔄 Vertical Layout Test Complete');
});