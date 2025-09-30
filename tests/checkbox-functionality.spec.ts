import { test, expect } from '@playwright/test';

test.describe('VM Checkbox Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1421');
    
    // Wait for the application to load
    await page.waitForSelector('svg', { timeout: 10000 });
    
    // Navigate to a project with capacity visualizer
    await page.click('text=Projects');
    await page.waitForSelector('text=Create New Project', { timeout: 5000 });
    
    // Look for existing projects or create one
    const projectExists = await page.locator('text=Test Project').count() > 0;
    if (!projectExists) {
      await page.click('text=Create New Project');
      await page.fill('input[placeholder*="project name"]', 'Test Project');
      await page.click('button:has-text("Create")');
    } else {
      await page.click('text=Test Project');
    }
    
    // Navigate to capacity visualizer
    await page.click('text=Capacity Visualizer');
    await page.waitForSelector('svg', { timeout: 10000 });
    
    // Wait for visualization to render
    await page.waitForTimeout(2000);
  });

  test('should show VM rectangles and checkboxes', async ({ page }) => {
    // Take screenshot to see current state
    await page.screenshot({ path: '/tmp/checkbox-test-initial.png', fullPage: true });
    
    // Check if VM rectangles exist
    const vmRects = await page.locator('svg rect[fill*="rgba(99, 102, 241"]').count();
    console.log(`Found ${vmRects} VM rectangles`);
    
    // Check if checkboxes exist
    const checkboxes = await page.locator('svg g.vm-checkbox-inline').count();
    console.log(`Found ${checkboxes} VM checkboxes`);
    
    expect(vmRects).toBeGreaterThan(0);
    expect(checkboxes).toBeGreaterThan(0);
  });

  test('should toggle checkbox when clicking VM rectangle', async ({ page }) => {
    await page.screenshot({ path: '/tmp/checkbox-test-before-click.png', fullPage: true });
    
    // Find first VM rectangle
    const vmRect = page.locator('svg rect[fill*="rgba(99, 102, 241"]').first();
    await expect(vmRect).toBeVisible();
    
    // Get initial selection state
    const initialFill = await vmRect.getAttribute('fill');
    console.log('Initial VM rectangle fill:', initialFill);
    
    // Click the VM rectangle
    await vmRect.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: '/tmp/checkbox-test-after-vm-click.png', fullPage: true });
    
    // Check if selection state changed
    const newFill = await vmRect.getAttribute('fill');
    console.log('New VM rectangle fill:', newFill);
    
    // Check if migration panel appeared (indicates selection)
    const migrationPanel = page.locator('text=Selected VMs');
    if (await migrationPanel.count() > 0) {
      console.log('Migration panel visible - VM selected successfully');
    } else {
      console.log('Migration panel not visible - VM selection may have failed');
    }
  });

  test('should toggle checkbox when clicking checkbox directly', async ({ page }) => {
    await page.screenshot({ path: '/tmp/checkbox-test-before-checkbox-click.png', fullPage: true });
    
    // Find first checkbox
    const checkbox = page.locator('svg g.vm-checkbox-inline rect').first();
    
    if (await checkbox.count() > 0) {
      console.log('Checkbox found, attempting to click');
      
      // Get initial checkbox state
      const initialFill = await checkbox.getAttribute('fill');
      console.log('Initial checkbox fill:', initialFill);
      
      // Click the checkbox
      await checkbox.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: '/tmp/checkbox-test-after-checkbox-click.png', fullPage: true });
      
      // Check if checkbox state changed
      const newFill = await checkbox.getAttribute('fill');
      console.log('New checkbox fill:', newFill);
      
      // Check if migration panel appeared
      const migrationPanel = page.locator('text=Selected VMs');
      if (await migrationPanel.count() > 0) {
        console.log('Migration panel visible - checkbox click successful');
      } else {
        console.log('Migration panel not visible - checkbox click may have failed');
      }
    } else {
      console.log('No checkboxes found');
    }
  });

  test('should handle multiple VM selections', async ({ page }) => {
    // Click multiple VM rectangles
    const vmRects = page.locator('svg rect[fill*="rgba(99, 102, 241"]');
    const vmCount = await vmRects.count();
    console.log(`Found ${vmCount} VM rectangles`);
    
    if (vmCount >= 2) {
      // Click first VM
      await vmRects.nth(0).click();
      await page.waitForTimeout(300);
      
      // Click second VM
      await vmRects.nth(1).click();
      await page.waitForTimeout(300);
      
      await page.screenshot({ path: '/tmp/checkbox-test-multi-select.png', fullPage: true });
      
      // Check migration panel shows multiple VMs
      const migrationPanel = page.locator('text=Selected VMs');
      if (await migrationPanel.count() > 0) {
        const panelText = await migrationPanel.textContent();
        console.log('Migration panel text:', panelText);
        expect(panelText).toContain('2');
      }
    }
  });

  test('should work with zoom functionality', async ({ page }) => {
    // Find a host rectangle to zoom into
    const hostRect = page.locator('svg rect[fill*="rgba(139, 92, 246, 0.3)"]').first();
    
    if (await hostRect.count() > 0) {
      console.log('Host found, zooming in');
      await hostRect.click();
      await page.waitForTimeout(1000); // Wait for zoom animation
      
      await page.screenshot({ path: '/tmp/checkbox-test-after-zoom.png', fullPage: true });
      
      // Try clicking VM after zoom
      const vmRect = page.locator('svg rect[fill*="rgba(99, 102, 241"]').first();
      if (await vmRect.count() > 0) {
        await vmRect.click();
        await page.waitForTimeout(500);
        
        await page.screenshot({ path: '/tmp/checkbox-test-zoomed-click.png', fullPage: true });
        
        const migrationPanel = page.locator('text=Selected VMs');
        if (await migrationPanel.count() > 0) {
          console.log('VM selection works after zoom');
        } else {
          console.log('VM selection failed after zoom');
        }
      }
    }
  });

  test('should debug DOM structure', async ({ page }) => {
    // Log DOM structure for debugging
    const svgContent = await page.locator('svg').innerHTML();
    console.log('SVG content length:', svgContent.length);
    
    // Count different elements
    const vmGroups = await page.locator('svg g[class*="vm-"]').count();
    const checkboxGroups = await page.locator('svg g.vm-checkbox-inline').count();
    const vmRects = await page.locator('svg rect[fill*="rgba(99, 102, 241"]').count();
    const checkboxRects = await page.locator('svg g.vm-checkbox-inline rect').count();
    
    console.log('VM groups:', vmGroups);
    console.log('Checkbox groups:', checkboxGroups);
    console.log('VM rectangles:', vmRects);
    console.log('Checkbox rectangles:', checkboxRects);
    
    // Check if elements have click handlers
    const vmWithClick = await page.locator('svg rect[fill*="rgba(99, 102, 241"]').first();
    const hasClickHandler = await vmWithClick.evaluate(el => {
      return (el as any)._onclick !== undefined;
    });
    console.log('VM rectangle has click handler:', hasClickHandler);
  });
});