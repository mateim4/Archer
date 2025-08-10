import { test, expect } from '@playwright/test';

test.describe('File Upload Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the vendor data collection view
    await page.goto('http://localhost:1420');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
    
    // Navigate to Vendor Data Collection
    await page.click('text=Vendor Data Collection');
    
    // Wait for the view to load
    await page.waitForSelector('text=Vendor Data Collection & Analysis', { timeout: 5000 });
  });

  test('Upload components should be fully visible and not cropped', async ({ page }) => {
    // Navigate to Upload tab if not already there
    await page.click('text=Upload');
    
    // Wait for upload components to load
    await page.waitForSelector('text=Hardware Configuration Upload', { timeout: 5000 });
    
    // Check that all upload components are visible
    const uploadComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    const count = await uploadComponents.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Check each upload component
    for (let i = 0; i < count; i++) {
      const component = uploadComponents.nth(i);
      
      // Verify component is visible
      await expect(component).toBeVisible();
      
      // Get bounding box to check dimensions
      const boundingBox = await component.boundingBox();
      expect(boundingBox).toBeTruthy();
      
      if (boundingBox) {
        // Verify component has reasonable dimensions
        expect(boundingBox.width).toBeGreaterThan(250); // Should be at least 250px wide
        expect(boundingBox.height).toBeGreaterThan(150); // Should be at least 150px tall
        
        // Verify component is not cropped (should be within viewport)
        expect(boundingBox.x).toBeGreaterThanOrEqual(0);
        expect(boundingBox.y).toBeGreaterThanOrEqual(0);
        
        const viewportSize = page.viewportSize();
        if (viewportSize) {
          expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewportSize.width);
          expect(boundingBox.y + boundingBox.height).toBeLessThanOrEqual(viewportSize.height);
        }
      }
    }
  });

  test('Upload components should not overlap with other elements', async ({ page }) => {
    // Navigate to Upload tab
    await page.click('text=Upload');
    await page.waitForSelector('text=Hardware Configuration Upload', { timeout: 5000 });
    
    // Get all upload components
    const uploadComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    const count = await uploadComponents.count();
    
    // Check that components don't overlap with each other
    const boundingBoxes = [];
    for (let i = 0; i < count; i++) {
      const box = await uploadComponents.nth(i).boundingBox();
      if (box) {
        boundingBoxes.push(box);
      }
    }
    
    // Check for overlaps
    for (let i = 0; i < boundingBoxes.length; i++) {
      for (let j = i + 1; j < boundingBoxes.length; j++) {
        const box1 = boundingBoxes[i];
        const box2 = boundingBoxes[j];
        
        // Check if boxes overlap
        const noOverlap = 
          box1.x + box1.width <= box2.x || 
          box2.x + box2.width <= box1.x || 
          box1.y + box1.height <= box2.y || 
          box2.y + box2.height <= box1.y;
        
        expect(noOverlap).toBeTruthy();
      }
    }
  });

  test('Upload components should fit within their container cards', async ({ page }) => {
    // Navigate to Upload tab
    await page.click('text=Upload');
    await page.waitForSelector('text=Hardware Configuration Upload', { timeout: 5000 });
    
    // Get card containers
    const cards = await page.locator('div[style*="rgba(255, 255, 255, 0.9)"]');
    const cardCount = await cards.count();
    
    expect(cardCount).toBeGreaterThan(0);
    
    // For each card, check that upload components fit within it
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const cardBox = await card.boundingBox();
      
      if (cardBox) {
        // Find upload components within this card
        const uploadsInCard = card.locator('div[style*="border-2"][style*="border-dashed"]');
        const uploadCount = await uploadsInCard.count();
        
        for (let j = 0; j < uploadCount; j++) {
          const upload = uploadsInCard.nth(j);
          const uploadBox = await upload.boundingBox();
          
          if (uploadBox) {
            // Check that upload component is within card boundaries (with some tolerance for margins)
            expect(uploadBox.x).toBeGreaterThanOrEqual(cardBox.x - 5);
            expect(uploadBox.y).toBeGreaterThanOrEqual(cardBox.y - 5);
            expect(uploadBox.x + uploadBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width + 5);
            expect(uploadBox.y + uploadBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + 5);
          }
        }
      }
    }
  });

  test('Upload components should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop size (default)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.click('text=Upload');
    await page.waitForSelector('text=Hardware Configuration Upload', { timeout: 5000 });
    
    let uploadComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    let count = await uploadComponents.count();
    expect(count).toBeGreaterThan(0);
    
    // Verify components are visible on desktop
    for (let i = 0; i < count; i++) {
      await expect(uploadComponents.nth(i)).toBeVisible();
    }
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Allow layout to adjust
    
    uploadComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    count = await uploadComponents.count();
    
    // Verify components are still visible on tablet
    for (let i = 0; i < count; i++) {
      await expect(uploadComponents.nth(i)).toBeVisible();
    }
    
    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Allow layout to adjust
    
    uploadComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    count = await uploadComponents.count();
    
    // Verify components are still visible on mobile
    for (let i = 0; i < count; i++) {
      await expect(uploadComponents.nth(i)).toBeVisible();
      
      const boundingBox = await uploadComponents.nth(i).boundingBox();
      if (boundingBox) {
        // On mobile, components should maintain minimum usable size
        expect(boundingBox.width).toBeGreaterThan(200);
        expect(boundingBox.height).toBeGreaterThan(120);
      }
    }
  });

  test('Hardware basket upload components should function correctly', async ({ page }) => {
    // Navigate to Basket tab
    await page.click('text=Basket');
    await page.waitForSelector('text=Upload Hardware Basket', { timeout: 5000 });
    
    // Find the hardware basket upload component
    const basketUpload = await page.locator('div[style*="border-2"][style*="border-dashed"]').first();
    await expect(basketUpload).toBeVisible();
    
    // Verify upload text is present
    await expect(basketUpload).toContainText('Click to upload');
    
    // Verify accepted file types are shown
    await expect(basketUpload).toContainText('.xlsx, .xls');
    
    // Check that the upload area is properly sized
    const boundingBox = await basketUpload.boundingBox();
    expect(boundingBox).toBeTruthy();
    
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(280);
      expect(boundingBox.height).toBeGreaterThan(150);
    }
  });

  test('Upload components should have proper hover states', async ({ page }) => {
    // Navigate to Upload tab
    await page.click('text=Upload');
    await page.waitForSelector('text=Hardware Configuration Upload', { timeout: 5000 });
    
    const uploadComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    const count = await uploadComponents.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Test hover state on first upload component
    const firstComponent = uploadComponents.first();
    
    // Get initial styles
    const initialBorderColor = await firstComponent.evaluate(el => 
      getComputedStyle(el).borderColor
    );
    
    // Hover over the component
    await firstComponent.hover();
    
    // Wait for transition
    await page.waitForTimeout(300);
    
    // Check that hover state changes the appearance
    const hoveredBorderColor = await firstComponent.evaluate(el => 
      getComputedStyle(el).borderColor
    );
    
    // Border color should change on hover (from gray to purple)
    expect(hoveredBorderColor).not.toBe(initialBorderColor);
  });

  test('Upload components should maintain aspect ratio and centering', async ({ page }) => {
    // Navigate to Upload tab
    await page.click('text=Upload');
    await page.waitForSelector('text=Hardware Configuration Upload', { timeout: 5000 });
    
    const uploadComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    const count = await uploadComponents.count();
    
    for (let i = 0; i < count; i++) {
      const component = uploadComponents.nth(i);
      const boundingBox = await component.boundingBox();
      
      if (boundingBox) {
        // Check aspect ratio is reasonable (width should be greater than height)
        const aspectRatio = boundingBox.width / boundingBox.height;
        expect(aspectRatio).toBeGreaterThan(1.2); // Should be wider than tall
        expect(aspectRatio).toBeLessThan(3.0); // But not too wide
        
        // Check that component appears centered within its container
        const parent = await component.locator('xpath=..').first();
        const parentBox = await parent.boundingBox();
        
        if (parentBox) {
          const centerX = boundingBox.x + boundingBox.width / 2;
          const parentCenterX = parentBox.x + parentBox.width / 2;
          
          // Allow some tolerance for centering (within 20px)
          expect(Math.abs(centerX - parentCenterX)).toBeLessThan(20);
        }
      }
    }
  });

  test('Error states should not break layout', async ({ page }) => {
    // Navigate to Upload tab
    await page.click('text=Upload');
    await page.waitForSelector('text=Hardware Configuration Upload', { timeout: 5000 });
    
    // Simulate error by checking layout remains stable
    const uploadComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    const initialCount = await uploadComponents.count();
    
    // Get initial positions
    const initialPositions = [];
    for (let i = 0; i < initialCount; i++) {
      const box = await uploadComponents.nth(i).boundingBox();
      if (box) {
        initialPositions.push({ x: box.x, y: box.y });
      }
    }
    
    // Trigger a potential error by interacting with upload
    await uploadComponents.first().click();
    
    // Wait for any potential layout changes
    await page.waitForTimeout(500);
    
    // Verify layout hasn't shifted significantly
    const currentComponents = await page.locator('div[style*="border-2"][style*="border-dashed"]');
    const currentCount = await currentComponents.count();
    
    expect(currentCount).toBe(initialCount);
    
    // Check positions haven't shifted dramatically
    for (let i = 0; i < Math.min(initialCount, currentCount); i++) {
      const currentBox = await currentComponents.nth(i).boundingBox();
      
      if (currentBox && initialPositions[i]) {
        const deltaX = Math.abs(currentBox.x - initialPositions[i].x);
        const deltaY = Math.abs(currentBox.y - initialPositions[i].y);
        
        // Allow small movements but not major layout shifts
        expect(deltaX).toBeLessThan(50);
        expect(deltaY).toBeLessThan(50);
      }
    }
  });
});
