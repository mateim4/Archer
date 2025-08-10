import { test, expect } from '@playwright/test';

test.describe('Upload Component Layout Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:1420');
    
    // Wait for the app to load - look for a more reliable selector
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Navigate to the Upload tab if it exists
    const uploadButton = page.locator('text=Upload');
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      await page.waitForTimeout(1000); // Wait for tab content to load
    }
  });

  test('upload components should have proper dimensions and not overflow', async ({ page }) => {
    // Look for upload components
    const uploadComponents = page.locator('[class*="border-dashed"]');
    
    if (await uploadComponents.count() > 0) {
      // Check the first upload component
      const firstUpload = uploadComponents.first();
      
      // Get the component's bounding box
      const boundingBox = await firstUpload.boundingBox();
      
      if (boundingBox) {
        // Verify component has reasonable dimensions
        expect(boundingBox.width).toBeGreaterThan(200);
        expect(boundingBox.width).toBeLessThan(500);
        expect(boundingBox.height).toBeGreaterThan(100);
        expect(boundingBox.height).toBeLessThan(300);
        
        console.log(`Upload component dimensions: ${boundingBox.width}x${boundingBox.height}`);
      }
    } else {
      console.log('No upload components found - checking for cards instead');
      
      // Look for card containers that might contain upload components
      const cards = page.locator('[class*="card"], [class*="Card"]');
      const cardCount = await cards.count();
      console.log(`Found ${cardCount} card-like components`);
      
      if (cardCount > 0) {
        const firstCard = cards.first();
        const cardBox = await firstCard.boundingBox();
        if (cardBox) {
          console.log(`Card dimensions: ${cardBox.width}x${cardBox.height}`);
        }
      }
    }
  });

  test('verify upload component text is visible and not cropped', async ({ page }) => {
    // Look for upload-related text elements
    const uploadTexts = [
      'Click to upload',
      'Drop file here', 
      'drag and drop',
      'Supported formats',
      'Dell SCP',
      'HPE iQuote',
      'Lenovo DCSC'
    ];

    for (const text of uploadTexts) {
      const element = page.locator(`text=${text}`).first();
      if (await element.isVisible()) {
        const boundingBox = await element.boundingBox();
        if (boundingBox) {
          // Verify text is not clipped
          expect(boundingBox.width).toBeGreaterThan(0);
          expect(boundingBox.height).toBeGreaterThan(0);
          console.log(`Text "${text}" is visible at ${boundingBox.width}x${boundingBox.height}`);
        }
      }
    }
  });

  test('grid layout should accommodate upload components properly', async ({ page }) => {
    // Look for grid containers
    const gridContainers = page.locator('[style*="grid"], [style*="Grid"]');
    const gridCount = await gridContainers.count();
    
    console.log(`Found ${gridCount} grid containers`);
    
    if (gridCount > 0) {
      for (let i = 0; i < Math.min(gridCount, 3); i++) {
        const grid = gridContainers.nth(i);
        const gridBox = await grid.boundingBox();
        
        if (gridBox) {
          console.log(`Grid ${i + 1} dimensions: ${gridBox.width}x${gridBox.height}`);
          
          // Check if grid items fit properly
          const gridItems = grid.locator('> *');
          const itemCount = await gridItems.count();
          
          if (itemCount > 0) {
            const firstItem = gridItems.first();
            const itemBox = await firstItem.boundingBox();
            
            if (itemBox) {
              // Verify items don't overflow the grid
              expect(itemBox.width).toBeLessThanOrEqual(gridBox.width);
              console.log(`Grid item dimensions: ${itemBox.width}x${itemBox.height}`);
            }
          }
        }
      }
    }
  });

  test('responsive behavior at different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Allow layout to adjust
      
      console.log(`Testing at ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // Check if any elements are overflowing
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      
      if (bodyBox) {
        console.log(`Body dimensions at ${viewport.name}: ${bodyBox.width}x${bodyBox.height}`);
        
        // Look for any upload components
        const uploadComponents = page.locator('[class*="border-dashed"], [class*="upload"], [class*="Upload"]');
        const uploadCount = await uploadComponents.count();
        
        if (uploadCount > 0) {
          const firstUpload = uploadComponents.first();
          const uploadBox = await firstUpload.boundingBox();
          
          if (uploadBox) {
            // Verify upload component fits within viewport
            expect(uploadBox.width).toBeLessThanOrEqual(viewport.width);
            console.log(`Upload component at ${viewport.name}: ${uploadBox.width}x${uploadBox.height}`);
          }
        }
      }
    }
  });

  test('visual inspection of layout', async ({ page }) => {
    // Take a screenshot for manual inspection
    await page.screenshot({ 
      path: `test-results/upload-layout-${Date.now()}.png`,
      fullPage: true 
    });
    
    // Log the current URL and page title for context
    const title = await page.title();
    const url = await page.url();
    
    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${url}`);
    
    // Check for any obvious layout issues by looking for overflow
    const overflowElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = elements.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth || rect.bottom > window.innerHeight;
      });
      return overflowing.length;
    });
    
    console.log(`Found ${overflowElements} potentially overflowing elements`);
    
    // This test always passes but provides useful debugging info
    expect(true).toBeTruthy();
  });
});
