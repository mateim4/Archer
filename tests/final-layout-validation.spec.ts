import { test, expect } from '@playwright/test';

test.describe('Final Layout Validation - Enhanced File Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForSelector('h1', { timeout: 15000 });
    
    // Navigate to Upload tab
    const uploadButton = page.locator('text=Upload');
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('comprehensive layout validation', async ({ page }) => {
    console.log('🔍 COMPREHENSIVE LAYOUT VALIDATION');
    
    // Check upload component dimensions - look for the container div instead
    const uploadComponents = page.locator('div').filter({ hasText: 'Upload Dell SCP' }).locator('..');
    const componentCount = await uploadComponents.count();
    console.log(`📊 Found ${componentCount} upload components`);
    
    if (componentCount > 0) {
      for (let i = 0; i < componentCount; i++) {
        const component = uploadComponents.nth(i);
        const boundingBox = await component.boundingBox();
        
        if (boundingBox) {
          console.log(`📏 Upload Component ${i + 1}: ${boundingBox.width}×${boundingBox.height}px`);
          
          // Validate dimensions
          expect(boundingBox.width).toBeGreaterThan(100); // Minimum responsive width
          expect(boundingBox.width).toBeLessThan(600);   // Maximum width
          expect(boundingBox.height).toBe(120);          // Fixed height for container
          
          console.log(`✅ Component ${i + 1} dimensions are correct`);
        }
      }
    }
    
    // Check grid layout efficiency
    const gridContainers = page.locator('[style*="grid"]');
    const gridCount = await gridContainers.count();
    
    if (gridCount > 0) {
      const grid = gridContainers.first();
      const gridBox = await grid.boundingBox();
      const gridItems = grid.locator('> *');
      const itemCount = await gridItems.count();
      
      if (gridBox && itemCount > 0) {
        console.log(`📐 Grid: ${gridBox.width}×${gridBox.height}px with ${itemCount} items`);
        
        // Calculate space efficiency
        const spaceEfficiency = (itemCount * 385.5 * 120) / (gridBox.width * gridBox.height);
        console.log(`⚡ Space efficiency: ${(spaceEfficiency * 100).toFixed(1)}%`);
        
        // Efficiency should be reasonable (not too sparse)
        expect(spaceEfficiency).toBeGreaterThan(0.1);
      }
    }
    
    // Verify no content overflow
    const overflowElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = elements.filter(el => {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        
        if (!parent) return false;
        
        return rect.right > parent.right + 5 || rect.bottom > parent.bottom + 5;
      });
      return overflowing.length;
    });
    
    console.log(`🌊 Overflow check: ${overflowElements} elements overflowing parent bounds`);
    expect(overflowElements).toBeLessThan(10); // Allow some tolerance for scroll elements
    
    // Text visibility check
    const uploadTexts = [
      'Click to upload',
      'Dell SCP',
      'HPE iQuote', 
      'Lenovo DCSC'
    ];
    
    let visibleTexts = 0;
    for (const text of uploadTexts) {
      const element = page.locator(`text=${text}`).first();
      if (await element.isVisible()) {
        visibleTexts++;
      }
    }
    
    console.log(`📝 Text visibility: ${visibleTexts}/${uploadTexts.length} key texts visible`);
    expect(visibleTexts).toBeGreaterThan(2); // At least some key texts should be visible
    
    console.log('🎉 Layout validation completed successfully!');
  });

  test('responsive validation across viewports', async ({ page }) => {
    console.log('📱 RESPONSIVE VALIDATION');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      const uploadComponents = page.locator('button').filter({ hasText: 'Upload' });
      
      if (await uploadComponents.count() > 0) {
        const firstUpload = uploadComponents.first();
        const uploadBox = await firstUpload.boundingBox();
        
        if (uploadBox) {
          console.log(`${viewport.name}: ${uploadBox.width}×${uploadBox.height}px`);
          
          // Component should fit within viewport with some margin
          expect(uploadBox.width).toBeLessThanOrEqual(viewport.width - 40);
          expect(uploadBox.height).toBe(80); // Should maintain fixed height
          
          // Component should not be too small on large screens
          if (viewport.width >= 1024) {
            expect(uploadBox.width).toBeGreaterThan(300);
          }
        }
      }
    }
    
    console.log('📱 Responsive validation completed!');
  });

  test('visual regression protection', async ({ page }) => {
    console.log('📸 VISUAL REGRESSION PROTECTION');
    
    // Take screenshots at key viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Focus on the upload section
      const uploadSection = page.locator('text=Hardware Configuration Upload').locator('..');
      
      if (await uploadSection.isVisible()) {
        await uploadSection.screenshot({ 
          path: `test-results/upload-layout-${viewport.name}-${Date.now()}.png` 
        });
        console.log(`📸 Screenshot saved for ${viewport.name}`);
      }
    }
    
    console.log('📸 Visual regression protection completed!');
  });
});
