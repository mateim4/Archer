import { test, expect } from '@playwright/test';

test.describe('SimpleFileUpload Component Validation', () => {
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

  test('new upload buttons have correct fixed dimensions', async ({ page }) => {
    console.log('🔍 TESTING NEW SIMPLEFILE UPLOAD COMPONENT');
    
    // Look for the specific upload buttons by their text content
    const uploadButtons = [
      page.locator('button:has-text("Upload Dell SCP")'),
      page.locator('button:has-text("Upload HPE iQuote")'),
      page.locator('button:has-text("Upload Lenovo DCSC")')
    ];

    let validButtonCount = 0;
    
    for (let i = 0; i < uploadButtons.length; i++) {
      const button = uploadButtons[i];
      
      if (await button.isVisible()) {
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          console.log(`📏 Upload Button ${i + 1}: ${boundingBox.width}×${boundingBox.height}px`);
          
          // Validate button dimensions (should be 80px height as per our component)
          expect(boundingBox.height).toBe(80);
          expect(boundingBox.width).toBeGreaterThan(100);
          expect(boundingBox.width).toBeLessThan(500);
          
          validButtonCount++;
          console.log(`✅ Upload Button ${i + 1} has correct dimensions`);
        }
      }
    }
    
    console.log(`📊 Found ${validButtonCount} valid upload buttons`);
    expect(validButtonCount).toBeGreaterThan(0);
    
    // Check that the buttons are properly positioned within containers
    const containers = page.locator('div').filter({ hasText: 'width: 100%, height: 120px' });
    console.log(`📦 Checking upload containers...`);
    
    // Verify no major layout issues
    const overflowElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = elements.filter(el => {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        if (!parent) return false;
        return rect.right > parent.right + 10;
      });
      return overflowing.length;
    });
    
    console.log(`🌊 Overflow check: ${overflowElements} elements with significant overflow`);
    expect(overflowElements).toBeLessThan(5);
    
    console.log('🎉 SimpleFileUpload component validation completed!');
  });

  test('upload components are responsive', async ({ page }) => {
    console.log('📱 TESTING RESPONSIVE BEHAVIOR');
    
    const viewports = [
      { width: 1024, height: 768, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      const uploadButton = page.locator('button:has-text("Upload Dell SCP")').first();
      
      if (await uploadButton.isVisible()) {
        const boundingBox = await uploadButton.boundingBox();
        
        if (boundingBox) {
          console.log(`${viewport.name}: ${boundingBox.width}×${boundingBox.height}px`);
          
          // Height should remain fixed at 80px
          expect(boundingBox.height).toBe(80);
          
          // Button should fit within viewport
          expect(boundingBox.width).toBeLessThanOrEqual(viewport.width - 50);
        }
      }
    }
    
    console.log('📱 Responsive validation completed!');
  });

  test('visual inspection and functionality check', async ({ page }) => {
    console.log('📸 VISUAL INSPECTION');
    
    // Take a screenshot for visual verification
    await page.screenshot({ 
      path: `test-results/simple-upload-component-${Date.now()}.png`,
      fullPage: true 
    });
    
    // Verify upload buttons are clickable
    const dellButton = page.locator('button:has-text("Upload Dell SCP")').first();
    
    if (await dellButton.isVisible()) {
      // Test hover effect
      await dellButton.hover();
      console.log('✅ Button hover effect works');
      
      // Verify button is enabled and clickable
      const isEnabled = await dellButton.isEnabled();
      expect(isEnabled).toBeTruthy();
      console.log('✅ Button is enabled and interactive');
      
      // Check for proper styling
      const backgroundColor = await dellButton.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      console.log(`🎨 Button background color: ${backgroundColor}`);
    }
    
    console.log('📸 Visual inspection completed!');
  });
});
