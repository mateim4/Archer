import { test, expect } from '@playwright/test';

test('Debug Console Errors', async ({ page }) => {
  console.log('🔍 DEBUGGING: Console errors during navigation');
  
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  
  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log(`Console ${type}: ${text}`);
    
    if (type === 'error') {
      consoleErrors.push(text);
    } else if (type === 'warning') {
      consoleWarnings.push(text);
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
    consoleErrors.push(`Page Error: ${error.message}`);
  });
  
  // Navigate to projects page
  console.log('Navigating to /app/projects...');
  await page.goto('/app/projects');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Click on Cloud Migration Project
  console.log('Clicking on Cloud Migration Project...');
  const cloudProject = page.getByText('Cloud Migration Project');
  await cloudProject.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Try to click on Capacity tab
  console.log('Clicking on Capacity tab...');
  try {
    const capacityTab = page.locator('[role="tab"]:has-text("Capacity")');
    await capacityTab.click();
    await page.waitForTimeout(2000);
    console.log('Successfully clicked Capacity tab');
  } catch (error) {
    console.log('Error clicking Capacity tab:', error);
  }
  
  // Wait a bit more to capture any async errors
  await page.waitForTimeout(3000);
  
  console.log('\n=== ERROR SUMMARY ===');
  console.log('Console Errors:', consoleErrors.length);
  consoleErrors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`);
  });
  
  console.log('Console Warnings:', consoleWarnings.length);
  consoleWarnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`);
  });
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/console-debug.png', fullPage: true });
  
  console.log('🔍 Console debug complete');
});