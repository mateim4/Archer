import { test, expect } from '@playwright/test';

test.describe('EnhancedFileUpload Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Vendor Data Collection view where upload components are used
    await page.goto('http://localhost:1420');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
    
    // Navigate to Vendor Data Collection view
    await page.click('text=Vendor Data Collection');
    await page.waitForSelector('text=Upload Hardware Basket', { timeout: 5000 });
    
    // Click on the Basket tab to see upload components
    await page.click('text=Basket');
    await page.waitForTimeout(1000); // Allow animation to complete
  });

  test('upload components should be fully visible within card boundaries', async ({ page }) => {
    // Find all upload components
    const uploadComponents = await page.locator('[class*="border-dashed"]').all();
    
    expect(uploadComponents.length).toBeGreaterThan(0);
    
    for (const uploadComponent of uploadComponents) {
      // Get the upload component's bounding box
      const uploadBox = await uploadComponent.boundingBox();
      expect(uploadBox).not.toBeNull();
      
      // Find the parent card container
      const parentCard = uploadComponent.locator('..').locator('..'); // Navigate up to card level
      const cardBox = await parentCard.boundingBox();
      expect(cardBox).not.toBeNull();
      
      // Verify upload component is within card boundaries
      expect(uploadBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
      expect(uploadBox!.y).toBeGreaterThanOrEqual(cardBox!.y);
      expect(uploadBox!.x + uploadBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width);
      expect(uploadBox!.y + uploadBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height);
    }
  });

  test('upload components should not overlap with card headers', async ({ page }) => {
    // Find card titles/subtitles
    const cardHeaders = await page.locator('h3:has-text("Hardware Basket")').all();
    
    for (const header of cardHeaders) {
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      
      // Find upload components in the same card
      const parentCard = header.locator('..').locator('..');
      const uploadComponents = await parentCard.locator('[class*="border-dashed"]').all();
      
      for (const uploadComponent of uploadComponents) {
        const uploadBox = await uploadComponent.boundingBox();
        expect(uploadBox).not.toBeNull();
        
        // Verify no vertical overlap - upload should be below header
        expect(uploadBox!.y).toBeGreaterThan(headerBox!.y + headerBox!.height);
      }
    }
  });

  test('upload component captions should be fully visible', async ({ page }) => {
    // Find upload components
    const uploadComponents = await page.locator('[class*="border-dashed"]').all();
    
    for (const uploadComponent of uploadComponents) {
      // Look for caption text (supported formats)
      const captions = await uploadComponent.locator('text=/Supported formats:|\.xlsx|\.xml|\.csv/').all();
      
      for (const caption of captions) {
        const captionBox = await caption.boundingBox();
        expect(captionBox).not.toBeNull();
        
        // Get parent upload component box
        const uploadBox = await uploadComponent.boundingBox();
        expect(uploadBox).not.toBeNull();
        
        // Verify caption is within upload component boundaries
        expect(captionBox!.y + captionBox!.height).toBeLessThanOrEqual(uploadBox!.y + uploadBox!.height);
        
        // Verify caption is not clipped by checking it's visible
        await expect(caption).toBeVisible();
      }
    }
  });

  test('upload components should maintain proper spacing in grid layout', async ({ page }) => {
    // Find the grid container
    const gridContainer = await page.locator('[style*="grid-template-columns"]').first();
    const gridBox = await gridContainer.boundingBox();
    expect(gridBox).not.toBeNull();
    
    // Find upload components within the grid
    const uploadComponents = await gridContainer.locator('[class*="border-dashed"]').all();
    
    if (uploadComponents.length > 1) {
      for (let i = 0; i < uploadComponents.length - 1; i++) {
        const currentBox = await uploadComponents[i].boundingBox();
        const nextBox = await uploadComponents[i + 1].boundingBox();
        
        expect(currentBox).not.toBeNull();
        expect(nextBox).not.toBeNull();
        
        // Check for proper spacing (no overlap)
        const hasVerticalSpace = currentBox!.y + currentBox!.height <= nextBox!.y;
        const hasHorizontalSpace = currentBox!.x + currentBox!.width <= nextBox!.x;
        
        // At least one dimension should have proper spacing
        expect(hasVerticalSpace || hasHorizontalSpace).toBeTruthy();
      }
    }
  });

  test('responsive behavior - upload components should adapt to smaller containers', async ({ page }) => {
    // Test at different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // Allow layout to adjust
      
      // Find upload components
      const uploadComponents = await page.locator('[class*="border-dashed"]').all();
      
      for (const uploadComponent of uploadComponents) {
        const uploadBox = await uploadComponent.boundingBox();
        expect(uploadBox).not.toBeNull();
        
        // Verify minimum usable dimensions
        expect(uploadBox!.width).toBeGreaterThan(200);
        expect(uploadBox!.height).toBeGreaterThan(100);
        
        // Verify it's not exceeding viewport
        expect(uploadBox!.x + uploadBox!.width).toBeLessThanOrEqual(viewport.width);
        
        // Verify component is still visible and functional
        await expect(uploadComponent).toBeVisible();
      }
    }
  });

  test('drag and drop areas should be properly sized and positioned', async ({ page }) => {
    // Find upload components
    const uploadComponents = await page.locator('[class*="border-dashed"]').all();
    
    for (const uploadComponent of uploadComponents) {
      // Hover over the component to test drag/drop interaction
      await uploadComponent.hover();
      
      // Check that hover state is applied
      await expect(uploadComponent).toHaveClass(/hover:border-purple-400/);
      
      // Verify the component has proper cursor style
      const cursorStyle = await uploadComponent.evaluate(el => 
        window.getComputedStyle(el).cursor
      );
      expect(cursorStyle).toBe('pointer');
      
      // Check for proper event handling setup
      const hasClickHandler = await uploadComponent.evaluate(el => 
        !!el.onclick || el.hasAttribute('onclick')
      );
      expect(hasClickHandler).toBeTruthy();
    }
  });

  test('upload components should maintain visual hierarchy within cards', async ({ page }) => {
    // Find cards with upload components
    const cards = await page.locator('[class*="lcm-card"], [style*="background: rgba"]').all();
    
    for (const card of cards) {
      const uploadComponent = card.locator('[class*="border-dashed"]').first();
      
      if (await uploadComponent.count() > 0) {
        // Get z-index and stacking context
        const cardZIndex = await card.evaluate(el => 
          window.getComputedStyle(el).zIndex
        );
        
        const uploadZIndex = await uploadComponent.evaluate(el => 
          window.getComputedStyle(el).zIndex
        );
        
        // Upload component should not have higher z-index than its container
        if (cardZIndex !== 'auto' && uploadZIndex !== 'auto') {
          expect(parseInt(uploadZIndex)).toBeLessThanOrEqual(parseInt(cardZIndex) + 1);
        }
        
        // Check for proper backdrop-filter application
        const hasBackdropFilter = await uploadComponent.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.backdropFilter && style.backdropFilter !== 'none';
        });
        expect(hasBackdropFilter).toBeTruthy();
      }
    }
  });

  test('error states should not break layout', async ({ page }) => {
    // Navigate back to upload section
    await page.click('text=Upload');
    await page.waitForTimeout(500);
    
    // Find an upload component
    const uploadComponent = await page.locator('[class*="border-dashed"]').first();
    
    // Simulate error state by intercepting file API
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Upload failed' })
      });
    });
    
    // Trigger upload (this should fail and show error)
    await uploadComponent.click();
    
    // Wait for potential error states
    await page.waitForTimeout(1000);
    
    // Verify component is still properly positioned
    const uploadBox = await uploadComponent.boundingBox();
    expect(uploadBox).not.toBeNull();
    expect(uploadBox!.width).toBeGreaterThan(0);
    expect(uploadBox!.height).toBeGreaterThan(0);
    
    // Component should still be visible
    await expect(uploadComponent).toBeVisible();
  });

  test('processing states should maintain layout integrity', async ({ page }) => {
    // Find upload component
    const uploadComponent = await page.locator('[class*="border-dashed"]').first();
    
    // Get initial dimensions
    const initialBox = await uploadComponent.boundingBox();
    expect(initialBox).not.toBeNull();
    
    // Mock a slow upload to test processing state
    await page.route('**/api/**', route => {
      // Delay response to simulate processing
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true })
        });
      }, 2000);
    });
    
    // Trigger upload
    await uploadComponent.click();
    
    // Check processing state
    await expect(uploadComponent).toHaveClass(/opacity-75/);
    
    // Verify dimensions haven't changed significantly during processing
    const processingBox = await uploadComponent.boundingBox();
    expect(processingBox).not.toBeNull();
    
    expect(Math.abs(processingBox!.width - initialBox!.width)).toBeLessThan(10);
    expect(Math.abs(processingBox!.height - initialBox!.height)).toBeLessThan(10);
    
    // Verify spinner is visible and properly positioned
    const spinner = await uploadComponent.locator('.animate-spin');
    await expect(spinner).toBeVisible();
    
    const spinnerBox = await spinner.boundingBox();
    expect(spinnerBox).not.toBeNull();
    
    // Spinner should be centered within upload component
    const uploadCenter = {
      x: processingBox!.x + processingBox!.width / 2,
      y: processingBox!.y + processingBox!.height / 2
    };
    
    const spinnerCenter = {
      x: spinnerBox!.x + spinnerBox!.width / 2,
      y: spinnerBox!.y + spinnerBox!.height / 2
    };
    
    expect(Math.abs(spinnerCenter.x - uploadCenter.x)).toBeLessThan(20);
    expect(Math.abs(spinnerCenter.y - uploadCenter.y)).toBeLessThan(20);
  });
});
