import { test, expect } from '@playwright/test';

test.describe('Manual Checkbox Test', () => {
  test('should test checkbox functionality directly', async ({ page }) => {
    // Go directly to the app
    await page.goto('http://localhost:1421');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    console.log('App loaded, taking screenshot...');
    await page.screenshot({ path: '/tmp/manual-test-initial.png', fullPage: true });
    
    // Click "Start Planning" to enter the application
    console.log('Clicking Start Planning...');
    await page.click('text=Start Planning');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/manual-test-after-start.png', fullPage: true });
    
    // Navigate to Capacity Visualizer if it exists
    const capacityVisualizerLink = page.locator('text=Capacity Visualizer');
    if (await capacityVisualizerLink.count() > 0) {
      console.log('Clicking Capacity Visualizer...');
      await capacityVisualizerLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/manual-test-capacity-visualizer.png', fullPage: true });
    } else {
      console.log('No Capacity Visualizer link found, looking for other navigation...');
      // Try other potential navigation options
      const links = await page.locator('a, button').allTextContents();
      console.log('Available links:', links.slice(0, 20));
    }
    
    // Look for SVG elements
    const svg = await page.locator('svg').first();
    if (await svg.count() > 0) {
      console.log('SVG found');
      
      // Look for VM rectangles
      const vmRects = await page.locator('svg rect[fill*="rgba(99, 102, 241"]').count();
      console.log(`Found ${vmRects} VM rectangles`);
      
      // Look for checkboxes
      const checkboxes = await page.locator('svg g.vm-checkbox-inline').count();
      console.log(`Found ${checkboxes} VM checkboxes`);
      
      if (vmRects > 0) {
        console.log('Attempting to click first VM rectangle...');
        const firstVMRect = page.locator('svg rect[fill*="rgba(99, 102, 241"]').first();
        await firstVMRect.click();
        
        await page.waitForTimeout(1000);
        await page.screenshot({ path: '/tmp/manual-test-after-vm-click.png', fullPage: true });
        
        // Check if migration panel appeared
        const migrationPanel = await page.locator('text=Selected VMs').count();
        console.log(`Migration panel visible: ${migrationPanel > 0}`);
        
        if (checkboxes > 0) {
          console.log('Attempting to click first checkbox...');
          const firstCheckbox = page.locator('svg g.vm-checkbox-inline rect').first();
          await firstCheckbox.click();
          
          await page.waitForTimeout(1000);
          await page.screenshot({ path: '/tmp/manual-test-after-checkbox-click.png', fullPage: true });
          
          // Check migration panel again
          const migrationPanel2 = await page.locator('text=Selected VMs').count();
          console.log(`Migration panel after checkbox click: ${migrationPanel2 > 0}`);
        }
      }
    } else {
      console.log('No SVG found, trying to navigate to capacity visualizer...');
      
      // Try to find navigation elements
      const navLinks = await page.locator('a, button').allTextContents();
      console.log('Available navigation:', navLinks.slice(0, 10));
      
      // Look for capacity visualizer link
      const capacityLink = page.locator('text=Capacity');
      if (await capacityLink.count() > 0) {
        await capacityLink.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: '/tmp/manual-test-after-nav.png', fullPage: true });
      }
    }
  });
});