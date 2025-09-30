import { test, expect } from '@playwright/test';

test.describe('Simple Visualizer Full Test', () => {
  test('Test Simple Visualizer with Migration View', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate to app
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    
    // Click on first project
    const projectCard = page.locator('.project-card').first();
    if (await projectCard.count() > 0) {
      await projectCard.click();
      await page.waitForTimeout(1500);
      
      // Navigate to Capacity Visualizer
      await page.locator('text=Capacity Visualizer').click();
      await page.waitForTimeout(2000);
      
      // Turn OFF Advanced Visualizer to show Simple Visualizer
      const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
      if (await advancedToggle.isChecked()) {
        await advancedToggle.click();
        await page.waitForTimeout(1500);
      }
      
      // Take screenshot of Simple Visualizer default view
      await page.screenshot({ path: 'test-results/simple-visualizer-default.png', fullPage: true });
      console.log('Screenshot 1: Simple Visualizer default view saved');
      
      // Check what's visible
      const bodyText = await page.locator('body').innerText();
      console.log('--- Checking visible content ---');
      console.log('Has "Capacity":', bodyText.includes('Capacity'));
      console.log('Has "Hosts":', bodyText.includes('Hosts'));
      console.log('Has "Virtual Machines":', bodyText.includes('Virtual Machines'));
      
      // Check for cluster cards
      const cards = await page.locator('.lcm-card').count();
      console.log('Number of .lcm-card elements:', cards);
      
      // Check for SVG elements (pie charts)
      const svgs = await page.locator('svg').count();
      console.log('Number of SVG elements:', svgs);
      
      // Check for tables
      const tables = await page.locator('table').count();
      console.log('Number of tables:', tables);
      
      // Now enable Migration View
      const migrationToggle = page.locator('text=Migration View').locator('..').locator('input[type="checkbox"]');
      if (await migrationToggle.count() > 0) {
        console.log('Migration View toggle found, clicking it...');
        await migrationToggle.click();
        await page.waitForTimeout(1500);
        
        // Take screenshot of Migration View
        await page.screenshot({ path: 'test-results/simple-visualizer-migration.png', fullPage: true });
        console.log('Screenshot 2: Migration View saved');
        
        // Check for Source/Destination sections
        const sourceVisible = await page.locator('text=Source Clusters').isVisible();
        const destVisible = await page.locator('text=Destination Clusters').isVisible();
        
        console.log('Source Clusters visible:', sourceVisible);
        console.log('Destination Clusters visible:', destVisible);
      }
      
      // Print all console logs from the page
      console.log('\n--- Console logs from page ---');
      consoleLogs.forEach(log => console.log(log));
      
      // Check visualization mode dropdown
      const vizModeDropdown = await page.locator('select').filter({ has: page.locator('option:has-text("CPU Cores")') }).count();
      console.log('Visualization mode dropdown exists:', vizModeDropdown > 0);
      
      // Try changing visualization mode
      if (vizModeDropdown > 0) {
        const dropdown = page.locator('select').first();
        await dropdown.selectOption('memory');
        await page.waitForTimeout(1000);
        console.log('Changed to Memory view');
        
        await dropdown.selectOption('storage');
        await page.waitForTimeout(1000);
        console.log('Changed to Storage view');
      }
    } else {
      console.log('No projects found to test with');
    }
  });
});