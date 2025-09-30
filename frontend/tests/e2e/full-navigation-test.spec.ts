import { test, expect } from '@playwright/test';

test.describe('Full Navigation to Simple Visualizer', () => {
  test('Navigate through app to test Simple Visualizer', async ({ page }) => {
    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Navigate to app
    await page.goto('http://localhost:1420');
    await page.waitForTimeout(2000);
    
    // Click "Start Planning" to enter the main app
    const startPlanningBtn = page.locator('text=Start Planning');
    await startPlanningBtn.click();
    await page.waitForTimeout(2000);
    
    // Take screenshot after clicking Start Planning
    await page.screenshot({ path: 'test-results/after-start-planning.png', fullPage: true });
    console.log('Screenshot 1: After Start Planning');
    
    // Look for Projects or any navigation
    const projectsLink = page.locator('text=Projects').or(page.locator('[href*="project"]')).or(page.locator('text=Create Project'));
    const projectsCount = await projectsLink.count();
    console.log('Projects links found:', projectsCount);
    
    if (projectsCount > 0) {
      await projectsLink.first().click();
      await page.waitForTimeout(2000);
      
      // Take screenshot after navigating to projects
      await page.screenshot({ path: 'test-results/projects-page.png', fullPage: true });
      console.log('Screenshot 2: Projects page');
    }
    
    // Look for any existing project or create one
    const projectCard = page.locator('.project-card').or(page.locator('[class*="project"]')).or(page.locator('text=New Project'));
    const projectCardCount = await projectCard.count();
    console.log('Project cards found:', projectCardCount);
    
    if (projectCardCount > 0) {
      await projectCard.first().click();
      await page.waitForTimeout(2000);
    } else {
      // Try to create a new project if no existing ones
      const createBtn = page.locator('text=Create').or(page.locator('text=New')).or(page.locator('button').filter({ hasText: 'Add' }));
      const createBtnCount = await createBtn.count();
      console.log('Create buttons found:', createBtnCount);
      
      if (createBtnCount > 0) {
        await createBtn.first().click();
        await page.waitForTimeout(1000);
        
        // Fill in a basic project name
        const nameInput = page.locator('input[placeholder*="name"]').or(page.locator('input[type="text"]')).first();
        const nameInputCount = await nameInput.count();
        if (nameInputCount > 0) {
          await nameInput.fill('Test Project');
          await page.waitForTimeout(500);
          
          // Look for submit/save button
          const saveBtn = page.locator('text=Save').or(page.locator('text=Create')).or(page.locator('button[type="submit"]'));
          const saveBtnCount = await saveBtn.count();
          if (saveBtnCount > 0) {
            await saveBtn.first().click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }
    
    // Take screenshot of current state
    await page.screenshot({ path: 'test-results/current-state.png', fullPage: true });
    console.log('Screenshot 3: Current state');
    
    // Now look for Capacity Visualizer or any capacity-related navigation
    const capacityLinks = page.locator('text=Capacity').or(page.locator('[href*="capacity"]')).or(page.locator('text=Visualizer'));
    const capacityCount = await capacityLinks.count();
    console.log('Capacity links found:', capacityCount);
    
    if (capacityCount > 0) {
      await capacityLinks.first().click();
      await page.waitForTimeout(2000);
      
      // Now we should be in the Capacity Visualizer!
      const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
      const toggleExists = await advancedToggle.count() > 0;
      console.log('Advanced Visualizer toggle found:', toggleExists);
      
      if (toggleExists) {
        // Make sure it's OFF to show Simple Visualizer
        const isChecked = await advancedToggle.isChecked();
        console.log('Advanced toggle checked:', isChecked);
        
        if (isChecked) {
          await advancedToggle.click();
          await page.waitForTimeout(2000);
        }
        
        // Now take screenshot of Simple Visualizer
        await page.screenshot({ path: 'test-results/simple-visualizer-final.png', fullPage: true });
        console.log('Screenshot 4: Simple Visualizer');
        
        // Check what's visible
        const bodyText = await page.locator('body').innerText();
        console.log('--- Simple Visualizer Content Check ---');
        console.log('Contains "Source Clusters":', bodyText.includes('Source Clusters'));
        console.log('Contains "Destination Clusters":', bodyText.includes('Destination Clusters'));
        console.log('Contains "ESX-HOST":', bodyText.includes('ESX-HOST'));
        console.log('Contains "WEB-SERVER":', bodyText.includes('WEB-SERVER'));
        console.log('Contains "Virtual Machines":', bodyText.includes('Virtual Machines'));
        console.log('Contains "Hosts":', bodyText.includes('Hosts'));
        
        // Count visual elements
        const cards = await page.locator('.lcm-card').count();
        const svgs = await page.locator('svg').count();
        const tables = await page.locator('table').count();
        const progressBars = await page.locator('[style*="linear-gradient"]').count();
        
        console.log('Cards found:', cards);
        console.log('SVG elements (pie charts):', svgs);
        console.log('Tables found:', tables);
        console.log('Progress bars found:', progressBars);
      }
    }
    
    // Print all console logs from the browser
    console.log('\n--- Browser Console Logs ---');
    consoleLogs.forEach(log => console.log(log));
  });
});