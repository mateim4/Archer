import { test, expect, Page } from '@playwright/test';

test('Debug Capacity Visualizer Console Logs', async ({ page }) => {
  console.log('\n🐛 DEBUG: Capturing Capacity Visualizer Console Logs');
  
  // Capture console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'log') {
      consoleLogs.push(msg.text());
      console.log('BROWSER LOG:', msg.text());
    }
  });
  
  // Navigate to projects page
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  
  // Click on Cloud Migration Project
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Click on Capacity tab
  const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
  await capacityTab.click();
  await page.waitForTimeout(5000); // Give time for rendering and console logs
  
  console.log('\n📊 CONSOLE LOGS CAPTURED:');
  consoleLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  // Look for our specific debug logs
  const hostLogs = consoleLogs.filter(log => log.includes('Host text:') || log.includes('Host ') && log.includes('rectX'));
  const vmLogs = consoleLogs.filter(log => log.includes('VM text:'));
  
  console.log(`\n🎯 HOST LOGS (${hostLogs.length}):`);
  hostLogs.forEach(log => console.log(`  - ${log}`));
  
  console.log(`\n🎯 VM LOGS (${vmLogs.length}):`);
  vmLogs.forEach(log => console.log(`  - ${log}`));
  
  console.log('\n🐛 DEBUG Test Complete');
});