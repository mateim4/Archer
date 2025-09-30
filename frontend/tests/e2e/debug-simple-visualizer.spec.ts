import { test, expect } from '@playwright/test';

test.describe('Debug Simple Visualizer', () => {
  test('Check Simple Visualizer data and rendering', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Navigate to the app
    await page.goto('http://localhost:1420');
    
    // Wait for Projects to load
    await page.waitForTimeout(2000);
    
    // Click on a project to get to project detail view
    const projectCard = page.locator('.project-card').first();
    const hasProjects = await projectCard.count() > 0;
    
    if (hasProjects) {
      await projectCard.click();
      await page.waitForTimeout(1000);
      
      // Click on Capacity Visualizer tab
      const capacityTab = page.locator('text=Capacity Visualizer');
      if (await capacityTab.count() > 0) {
        await capacityTab.click();
        await page.waitForTimeout(2000);
        
        // Check if Advanced Visualizer toggle exists
        const advancedToggle = page.locator('text=Advanced Visualizer').locator('..').locator('input[type="checkbox"]');
        const toggleExists = await advancedToggle.count() > 0;
        console.log('Advanced toggle exists:', toggleExists);
        
        if (toggleExists) {
          // Make sure it's OFF to show Simple Visualizer
          const isChecked = await advancedToggle.isChecked();
          console.log('Advanced toggle is checked:', isChecked);
          
          if (isChecked) {
            await advancedToggle.click();
            await page.waitForTimeout(1000);
          }
          
          // Now we should see the Simple Visualizer
          // Check for cluster cards
          const clusterCards = page.locator('.lcm-card').filter({ hasText: 'Capacity' });
          const cardCount = await clusterCards.count();
          console.log('Number of cluster cards found:', cardCount);
          
          // Check for any visible text content
          const visibleText = await page.locator('body').innerText();
          console.log('Page contains "Source Clusters":', visibleText.includes('Source Clusters'));
          console.log('Page contains "Destination Clusters":', visibleText.includes('Destination Clusters'));
          console.log('Page contains "Hosts":', visibleText.includes('Hosts'));
          console.log('Page contains "Virtual Machines":', visibleText.includes('Virtual Machines'));
          
          // Check for Migration View toggle
          const migrationToggle = page.locator('text=Migration View').locator('..').locator('input[type="checkbox"]');
          const migrationToggleExists = await migrationToggle.count() > 0;
          console.log('Migration View toggle exists:', migrationToggleExists);
          
          if (migrationToggleExists) {
            // Enable migration view
            await migrationToggle.click();
            await page.waitForTimeout(1000);
            
            // Check for source/destination sections
            const sourceSection = page.locator('text=Source Clusters');
            const destSection = page.locator('text=Destination Clusters');
            
            console.log('Source section visible:', await sourceSection.isVisible());
            console.log('Destination section visible:', await destSection.isVisible());
          }
          
          // Check SVG elements for pie charts
          const svgElements = page.locator('svg');
          const svgCount = await svgElements.count();
          console.log('Number of SVG elements (pie charts):', svgCount);
          
          // Take a screenshot
          await page.screenshot({ path: 'simple-visualizer-debug.png', fullPage: true });
          console.log('Screenshot saved as simple-visualizer-debug.png');
          
          // Log the actual data in console
          const clustersData = await page.evaluate(() => {
            // Try to access React props or state
            const elements = document.querySelectorAll('[data-testid], .lcm-card, svg');
            return Array.from(elements).map(el => ({
              tag: el.tagName,
              classes: el.className,
              text: el.textContent?.substring(0, 100)
            }));
          });
          console.log('Elements found:', JSON.stringify(clustersData, null, 2));
        }
      }
    }
  });
});