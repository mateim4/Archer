import { test, expect } from '@playwright/test';

test.describe('Simple Visualizer Test - Existing Project', () => {
  test('Test Simple Visualizer using existing project', async ({ page }) => {
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
    
    // Take screenshot of projects page
    await page.screenshot({ path: 'test-results/projects-list.png', fullPage: true });
    console.log('Screenshot: Projects list');
    
    // Click on first existing project (should be "Cloud Migration Project")
    const firstProject = page.locator('text=Cloud Migration Project').or(page.locator('.project-card')).first();
    await firstProject.click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of project detail
    await page.screenshot({ path: 'test-results/project-detail-loaded.png', fullPage: true });
    console.log('Screenshot: Project detail view');
    
    // Look for Capacity Visualizer tab
    const capacityTab = page.locator('text=Capacity Visualizer').or(page.locator('text=Capacity'));
    const capacityCount = await capacityTab.count();
    console.log('Capacity tabs found:', capacityCount);
    
    if (capacityCount > 0) {
      await capacityTab.first().click();
      await page.waitForTimeout(3000);
      
      console.log('Successfully opened Capacity Visualizer!');
      
      // Take screenshot of capacity visualizer
      await page.screenshot({ path: 'test-results/capacity-visualizer-loaded.png', fullPage: true });
      console.log('Screenshot: Capacity Visualizer loaded');
      
      // Look for Advanced Visualizer toggle
      const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
      const toggleExists = await advancedToggle.count() > 0;
      console.log('Advanced Visualizer toggle exists:', toggleExists);
      
      if (toggleExists) {
        const isChecked = await advancedToggle.isChecked();
        console.log('Advanced toggle initially checked:', isChecked);
        
        // If it's checked (Advanced mode), turn it off to show Simple Visualizer
        if (isChecked) {
          console.log('Switching to Simple Visualizer...');
          await advancedToggle.click();
          await page.waitForTimeout(3000);
        }
        
        // Take screenshot of Simple Visualizer
        await page.screenshot({ path: 'test-results/simple-visualizer-active.png', fullPage: true });
        console.log('Screenshot: Simple Visualizer active');
        
        // Check content
        const bodyText = await page.locator('body').innerText();
        console.log('\n=== Simple Visualizer Content Check ===');
        console.log('Contains "Source Clusters":', bodyText.includes('Source Clusters'));
        console.log('Contains "Destination Clusters":', bodyText.includes('Destination Clusters'));
        console.log('Contains "Hosts":', bodyText.includes('Hosts'));
        console.log('Contains "Virtual Machines":', bodyText.includes('Virtual Machines'));
        console.log('Contains "ESX-HOST":', bodyText.includes('ESX-HOST'));
        console.log('Contains "WEB-SERVER":', bodyText.includes('WEB-SERVER'));
        console.log('Contains "Capacity":', bodyText.includes('Capacity'));
        
        // Count elements
        const cards = await page.locator('.lcm-card').count();
        const svgs = await page.locator('svg').count();
        const tables = await page.locator('table').count();
        const progressBars = await page.locator('[style*="linear-gradient"]').count();
        
        console.log('\n=== Visual Elements Count ===');
        console.log('LCM Cards found:', cards);
        console.log('SVG elements (pie charts):', svgs);
        console.log('Tables (VM lists):', tables);
        console.log('Progress bars:', progressBars);
        
        // SUCCESS - Simple Visualizer is working!
        if (cards > 0 || svgs > 0 || tables > 0) {
          console.log('✅ SUCCESS: Simple Visualizer is showing content!');
        } else {
          console.log('❌ WARNING: Simple Visualizer appears empty');
        }
        
      } else {
        console.log('❌ ERROR: Advanced Visualizer toggle not found');
      }
    } else {
      console.log('❌ ERROR: Capacity Visualizer tab not found');
      
      // Debug what tabs are available
      const allText = await page.locator('body').innerText();
      console.log('Available page text (first 300 chars):', allText.substring(0, 300));
    }
    
    // Print browser console logs
    console.log('\n=== Browser Console Logs ===');
    consoleLogs.forEach(log => console.log(log));
  });
});