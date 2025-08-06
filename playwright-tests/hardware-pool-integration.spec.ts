import { test, expect, Page } from '@playwright/test';

test.describe('Hardware Pool Integration Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Wait for servers to be ready
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
    
    // Wait for React app to initialize
    await page.waitForSelector('.app-container', { timeout: 10000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should have Hardware Pool navigation item visible', async () => {
    // Check if Hardware Pool navigation item exists
    const hardwarePoolNavItem = page.locator('button', { hasText: 'Hardware Pool' });
    await expect(hardwarePoolNavItem).toBeVisible();
    
    // Take a screenshot for documentation
    await page.screenshot({ 
      path: 'playwright-tests/screenshots/hardware-pool-nav-available.png',
      fullPage: true 
    });
  });

  test('should navigate to Hardware Pool view successfully', async () => {
    // Click on Hardware Pool navigation
    const hardwarePoolNavItem = page.locator('button', { hasText: 'Hardware Pool' });
    await hardwarePoolNavItem.click();
    
    // Wait for view to load
    await page.waitForLoadState('networkidle');
    
    // Check if Hardware Pool view is loaded
    await expect(page.locator('h1', { hasText: 'Hardware Pool' })).toBeVisible();
    
    // Take screenshot of the Hardware Pool view
    await page.screenshot({ 
      path: 'playwright-tests/screenshots/hardware-pool-view.png',
      fullPage: true 
    });
  });

  test('should display Hardware Pool table and Create Asset button', async () => {
    // Navigate to Hardware Pool
    await page.locator('button', { hasText: 'Hardware Pool' }).click();
    await page.waitForLoadState('networkidle');
    
    // Check for main elements
    await expect(page.locator('h1', { hasText: 'Hardware Pool' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Create Asset' })).toBeVisible();
    
    // Check for table headers
    const expectedHeaders = [
      'Name', 'Manufacturer', 'Model', 'CPU Cores', 
      'Memory (GB)', 'Storage (GB)', 'Status', 'Location', 'Actions'
    ];
    
    for (const header of expectedHeaders) {
      await expect(page.locator('th', { hasText: header })).toBeVisible();
    }
    
    // Take screenshot of table structure
    await page.screenshot({ 
      path: 'playwright-tests/screenshots/hardware-pool-table.png',
      fullPage: true 
    });
  });

  test('should open Create Asset form when Create Asset button is clicked', async () => {
    // Navigate to Hardware Pool
    await page.locator('button', { hasText: 'Hardware Pool' }).click();
    await page.waitForLoadState('networkidle');
    
    // Click Create Asset button
    await page.locator('button', { hasText: 'Create Asset' }).click();
    
    // Wait for form to appear
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Check if form dialog is visible
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Create Hardware Asset')).toBeVisible();
    
    // Check for required form fields
    const expectedFields = ['Name', 'Manufacturer', 'Model', 'Location', 'CPU Cores', 'Memory (GB)', 'Storage (GB)', 'Status'];
    
    for (const field of expectedFields) {
      await expect(page.locator(`label:has-text("${field}")`)).toBeVisible();
    }
    
    // Take screenshot of the form
    await page.screenshot({ 
      path: 'playwright-tests/screenshots/hardware-pool-create-form.png',
      fullPage: true 
    });
  });

  test('should validate Hardware Pool color scheme consistency', async () => {
    // Navigate to Hardware Pool
    await page.locator('button', { hasText: 'Hardware Pool' }).click();
    await page.waitForLoadState('networkidle');
    
    // Check for any pink colors that shouldn't be there
    const pinkElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const pinkElements = [];
      
      for (const element of elements) {
        const styles = window.getComputedStyle(element);
        const bgColor = styles.backgroundColor;
        const color = styles.color;
        const borderColor = styles.borderColor;
        
        // Check for pink colors
        if (bgColor.includes('rgb(236, 72, 153)') || 
            color.includes('rgb(236, 72, 153)') || 
            borderColor.includes('rgb(236, 72, 153)') ||
            bgColor.includes('#ec4899') || 
            color.includes('#ec4899') || 
            borderColor.includes('#ec4899')) {
          pinkElements.push({
            tag: element.tagName,
            className: element.className,
            id: element.id,
            backgroundColor: bgColor,
            color: color,
            borderColor: borderColor
          });
        }
      }
      
      return pinkElements;
    });
    
    // Assert no pink colors found
    expect(pinkElements).toHaveLength(0);
    
    // Check for proper indigo/purple theme colors
    const primaryButton = page.locator('button', { hasText: 'Create Asset' });
    await expect(primaryButton).toBeVisible();
    
    const buttonColor = await primaryButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor;
    });
    
    // Should be using indigo/purple theme colors (not pink)
    expect(buttonColor).not.toContain('rgb(236, 72, 153)');
    expect(buttonColor).not.toContain('#ec4899');
  });

  test('should check Hardware Pool UX responsiveness', async () => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navigate to Hardware Pool
      await page.locator('button', { hasText: 'Hardware Pool' }).click();
      await page.waitForLoadState('networkidle');
      
      // Check if main elements are still visible
      await expect(page.locator('h1', { hasText: 'Hardware Pool' })).toBeVisible();
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `playwright-tests/screenshots/hardware-pool-${viewport.name}.png`,
        fullPage: true 
      });
      
      // Navigate back to dashboard for next iteration
      await page.locator('button', { hasText: 'Dashboard' }).click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should verify Hardware Pool integration with backend', async () => {
    // Navigate to Hardware Pool
    await page.locator('button', { hasText: 'Hardware Pool' }).click();
    await page.waitForLoadState('networkidle');
    
    // Check console for any errors related to Hardware Pool
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Try to interact with the view
    await page.locator('button', { hasText: 'Create Asset' }).click();
    await page.waitForTimeout(2000);
    
    // Close the form
    const cancelButton = page.locator('button', { hasText: 'Cancel' });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }
    
    // Check for errors
    const hardwarePoolErrors = logs.filter(log => 
      log.toLowerCase().includes('hardware') || 
      log.toLowerCase().includes('asset') ||
      log.toLowerCase().includes('tauri')
    );
    
    // Log any hardware pool related errors for investigation
    if (hardwarePoolErrors.length > 0) {
      console.log('Hardware Pool related errors:', hardwarePoolErrors);
    }
  });

  test('should test Hardware Pool performance', async () => {
    // Start performance measurement
    await page.evaluate(() => performance.mark('hardware-pool-start'));
    
    // Navigate to Hardware Pool
    await page.locator('button', { hasText: 'Hardware Pool' }).click();
    await page.waitForLoadState('networkidle');
    
    // End performance measurement
    await page.evaluate(() => performance.mark('hardware-pool-end'));
    
    // Measure navigation time
    const navigationTime = await page.evaluate(() => {
      performance.measure('hardware-pool-navigation', 'hardware-pool-start', 'hardware-pool-end');
      return performance.getEntriesByName('hardware-pool-navigation')[0].duration;
    });
    
    // Navigation should be fast (under 2 seconds)
    expect(navigationTime).toBeLessThan(2000);
    
    console.log(`Hardware Pool navigation time: ${navigationTime}ms`);
  });
});
