import { test, expect } from '@playwright/test';

test.describe('Complete Simple Visualizer Test', () => {
  test('Create project and test Simple Visualizer', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate to app
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    
    // Click "Start Planning"
    await page.locator('text=Start Planning').click();
    await page.waitForTimeout(2000);
    
    // Navigate to Projects
    await page.locator('text=Projects').first().click();
    await page.waitForTimeout(2000);
    
    // Check if there are existing projects to click on
    const existingProjects = page.locator('.project-card').or(page.locator('[class*="project-card"]'));
    const existingCount = await existingProjects.count();
    
    if (existingCount > 0) {
      console.log('Found existing projects, clicking first one');
      await existingProjects.first().click();
      await page.waitForTimeout(2000);
    } else {
      console.log('No existing projects found, creating new one');
      
      // Fill out the create project form
      await page.locator('input[placeholder*="name"]').first().fill('Test Migration Project');
      await page.locator('textarea').first().fill('Test project for Simple Visualizer');
      
      // Select Migration project type
      await page.locator('text=Migration').click();
      
      // Create the project
      await page.locator('text=Create Project').click();
      await page.waitForTimeout(3000);
    }
    
    // Now we should be in project detail view - look for Capacity Visualizer tab
    await page.screenshot({ path: 'test-results/project-detail-view.png', fullPage: true });
    
    // Look for tabs or navigation within the project
    const capacityTab = page.locator('text=Capacity Visualizer').or(page.locator('text=Capacity')).or(page.locator('[role="tab"]').filter({ hasText: 'Capacity' }));
    const capacityTabCount = await capacityTab.count();
    console.log('Capacity tabs found:', capacityTabCount);
    
    if (capacityTabCount > 0) {
      await capacityTab.first().click();
      await page.waitForTimeout(3000);
      
      console.log('Successfully navigated to Capacity Visualizer!');
      
      // Now look for the Advanced Visualizer toggle
      const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
      const toggleExists = await advancedToggle.count() > 0;
      console.log('Advanced Visualizer toggle found:', toggleExists);
      
      if (toggleExists) {
        // Make sure Advanced Visualizer is OFF to show Simple Visualizer
        const isChecked = await advancedToggle.isChecked();
        console.log('Advanced toggle initially checked:', isChecked);
        
        if (isChecked) {
          console.log('Turning OFF Advanced Visualizer to show Simple Visualizer');
          await advancedToggle.click();
          await page.waitForTimeout(2000);
        }
        
        // Take screenshot of Simple Visualizer
        await page.screenshot({ path: 'test-results/simple-visualizer-working.png', fullPage: true });
        console.log('Screenshot taken of Simple Visualizer');
        
        // Now check what's actually visible
        const bodyText = await page.locator('body').innerText();
        console.log('\n--- Simple Visualizer Content Analysis ---');
        console.log('Page contains "Source Clusters":', bodyText.includes('Source Clusters'));
        console.log('Page contains "Destination Clusters":', bodyText.includes('Destination Clusters'));
        console.log('Page contains "ESX-HOST":', bodyText.includes('ESX-HOST'));
        console.log('Page contains "WEB-SERVER":', bodyText.includes('WEB-SERVER'));
        console.log('Page contains "Virtual Machines":', bodyText.includes('Virtual Machines'));
        console.log('Page contains "Hosts":', bodyText.includes('Hosts'));
        console.log('Page contains "Capacity":', bodyText.includes('Capacity'));
        
        // Count visual elements
        const cards = await page.locator('.lcm-card').count();
        const svgs = await page.locator('svg').count();
        const tables = await page.locator('table').count();
        const progressBars = await page.locator('[style*="linear-gradient"]').count();
        const checkboxes = await page.locator('input[type="checkbox"]').count();
        
        console.log('--- Visual Elements Count ---');
        console.log('LCM Cards:', cards);
        console.log('SVG elements (should include pie charts):', svgs);
        console.log('Tables (VM lists):', tables);
        console.log('Progress bars:', progressBars);
        console.log('Checkboxes (VM selection):', checkboxes);
        
        // Test visualization mode dropdown
        const vizModeDropdown = page.locator('select').filter({ has: page.locator('option:has-text("CPU Cores")') });
        const dropdownExists = await vizModeDropdown.count() > 0;
        console.log('Visualization mode dropdown exists:', dropdownExists);
        
        if (dropdownExists) {
          console.log('Testing visualization mode changes...');
          await vizModeDropdown.selectOption('memory');
          await page.waitForTimeout(1000);
          console.log('Changed to Memory mode');
          
          await vizModeDropdown.selectOption('storage');
          await page.waitForTimeout(1000);
          console.log('Changed to Storage mode');
          
          await vizModeDropdown.selectOption('cpu');
          await page.waitForTimeout(1000);
          console.log('Changed back to CPU mode');
        }
        
        // Test VM selection if any VMs are visible
        const vmCheckboxes = page.locator('table input[type="checkbox"]');
        const vmCheckboxCount = await vmCheckboxes.count();
        console.log('VM checkboxes found:', vmCheckboxCount);
        
        if (vmCheckboxCount > 0) {
          console.log('Testing VM selection...');
          await vmCheckboxes.first().click();
          await page.waitForTimeout(500);
          console.log('Selected first VM');
        }
        
        // Final screenshot
        await page.screenshot({ path: 'test-results/simple-visualizer-final-test.png', fullPage: true });
        console.log('Final test screenshot taken');
        
      } else {
        console.log('ERROR: Advanced Visualizer toggle not found!');
        await page.screenshot({ path: 'test-results/error-no-toggle.png', fullPage: true });
      }
    } else {
      console.log('ERROR: Could not find Capacity Visualizer tab!');
      await page.screenshot({ path: 'test-results/error-no-capacity-tab.png', fullPage: true });
      
      // Debug: print all visible text to see what tabs/options are available
      const allText = await page.locator('body').innerText();
      console.log('Available page content:', allText.substring(0, 500));
    }
    
    // Print all browser console logs
    console.log('\n--- Browser Console Logs ---');
    consoleLogs.forEach(log => console.log(log));
  });
});