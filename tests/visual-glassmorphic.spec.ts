import { test, expect } from '@playwright/test';

test.describe('Visual Glassmorphic Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the project management page
    await page.goto('/projects');
    
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    
    // Wait for glassmorphic elements to render
    await page.waitForTimeout(2000);
  });

  test('should capture glassmorphic design screenshots', async ({ page }) => {
    // Take full page screenshot
    await page.screenshot({ 
      path: 'test-results/glassmorphic-full-page.png',
      fullPage: true 
    });
    
    // Check if we have glassmorphic containers and take specific screenshots
    const glassContainers = page.locator('.glass-container');
    if (await glassContainers.count() > 0) {
      await glassContainers.first().screenshot({ 
        path: 'test-results/glassmorphic-header.png' 
      });
    }
    
    // Take responsive screenshots
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-results/glassmorphic-mobile.png',
      fullPage: true 
    });
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-results/glassmorphic-tablet.png',
      fullPage: true 
    });
    
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-results/glassmorphic-desktop.png',
      fullPage: true 
    });
  });

  test('should verify Poppins font is applied', async ({ page }) => {
    const body = page.locator('body');
    const computedStyle = await body.evaluate((el) => {
      return getComputedStyle(el).fontFamily;
    });
    
    expect(computedStyle).toContain('Poppins');
  });
  
  test('should have glassmorphic styling properties', async ({ page }) => {
    const glassContainers = page.locator('.glass-container');
    
    if (await glassContainers.count() > 0) {
      const firstContainer = glassContainers.first();
      
      // Check backdrop-filter
      const backdropFilter = await firstContainer.evaluate((el) => {
        return getComputedStyle(el).backdropFilter;
      });
      
      // Check background with rgba
      const background = await firstContainer.evaluate((el) => {
        return getComputedStyle(el).background;
      });
      
      expect(backdropFilter).toContain('blur');
      expect(background).toMatch(/rgba/);
    }
  });
});
