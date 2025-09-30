import { test, expect } from '@playwright/test';

test.describe('Direct Simple Visualizer Test', () => {
  test('Test Simple Visualizer directly with console logs', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate to app
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(3000);
    
    // Look for any navigation to get to Capacity Visualizer
    // Check if we can find any tab or link
    const capacityLink = page.locator('text=Capacity').or(page.locator('text=capacity')).or(page.locator('[data-testid*="capacity"]'));
    const linkCount = await capacityLink.count();
    console.log('Found capacity links:', linkCount);
    
    if (linkCount > 0) {
      await capacityLink.first().click();
      await page.waitForTimeout(2000);
    }
    
    // Look for the Advanced Visualizer toggle
    const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
    const toggleCount = await advancedToggle.count();
    console.log('Advanced toggle found:', toggleCount > 0);
    
    if (toggleCount > 0) {
      // Make sure Advanced Visualizer is OFF to show Simple Visualizer
      const isChecked = await advancedToggle.isChecked();
      console.log('Advanced toggle checked:', isChecked);
      
      if (isChecked) {
        await advancedToggle.click();
        await page.waitForTimeout(2000);
      }
      
      // Take a screenshot
      await page.screenshot({ path: 'test-results/simple-visualizer-direct-test.png', fullPage: true });
      console.log('Screenshot taken');
      
      // Check what's actually visible
      const bodyText = await page.locator('body').innerText();
      console.log('Page includes "Source Clusters":', bodyText.includes('Source Clusters'));
      console.log('Page includes "Destination Clusters":', bodyText.includes('Destination Clusters'));
      console.log('Page includes "Hosts":', bodyText.includes('Hosts'));
      console.log('Page includes "Virtual Machines":', bodyText.includes('Virtual Machines'));
      console.log('Page includes "ESX-HOST":', bodyText.includes('ESX-HOST'));
      console.log('Page includes "WEB-SERVER":', bodyText.includes('WEB-SERVER'));
      
      // Count elements
      const cards = await page.locator('.lcm-card').count();
      const svgs = await page.locator('svg').count();
      const tables = await page.locator('table').count();
      
      console.log('Cards found:', cards);
      console.log('SVGs found:', svgs);
      console.log('Tables found:', tables);
      
      // Check for specific elements
      const progressBars = await page.locator('[style*="background: linear-gradient(90deg, #8b5cf6, #a78bfa)"]').count();
      console.log('Progress bars found:', progressBars);
      
      // Check for VM checkboxes
      const checkboxes = await page.locator('input[type="checkbox"]').count();
      console.log('Checkboxes found:', checkboxes);
    }
    
    // Print all console logs
    console.log('\n--- All console logs ---');
    consoleLogs.forEach(log => console.log(log));
  });
});