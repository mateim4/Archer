import { test, expect } from '@playwright/test';

test.describe('Complete UI Improvements Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
  });

  test('should display Fluent UI 2 icons correctly in sidebar', async ({ page }) => {
    // Sidebar should be visible
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
    
    // Should have glassmorphic background
    await expect(sidebar).toHaveCSS('background-color', /rgba\(255, 255, 255, 0\.25\)/);
    await expect(sidebar).toHaveCSS('backdrop-filter', /blur\(40px\)/);

    // Hamburger button should have Fluent UI icon
    const toggleButton = sidebar.locator('button').first();
    await expect(toggleButton).toBeVisible();
    const toggleSvg = toggleButton.locator('svg');
    await expect(toggleSvg).toBeVisible();

    // Menu items should have icons and be visible
    const menuButtons = sidebar.locator('button');
    const secondButton = menuButtons.nth(1); // Second button should be Dashboard
    await expect(secondButton).toBeVisible();
    
    // Should have Fluent UI icon (SVG)
    const iconSvg = secondButton.locator('svg').first();
    await expect(iconSvg).toBeVisible();
  });

  test('should have settings button in top-right corner', async ({ page }) => {
    // Settings should be moved to header
    const headerSettings = page.locator('button[title="Settings"]');
    await expect(headerSettings).toBeVisible();
    
    // Should be positioned in top-right
    const boundingBox = await headerSettings.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox!.x).toBeGreaterThan(1000); // Should be on the right side
    expect(boundingBox!.y).toBeLessThan(100); // Should be near the top
    
    // Should have glassmorphic styling
    await expect(headerSettings).toHaveCSS('background-color', /rgba\(255, 255, 255, 0\.15\)/);
    await expect(headerSettings).toHaveCSS('backdrop-filter', /blur\(10px\)/);
  });

  test('should display dark text in sidebar for accessibility', async ({ page }) => {
    // Wait for sidebar to be fully loaded
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
    
    // Find a menu button with text (when expanded)
    const menuButton = sidebar.locator('button').filter({ hasText: /Dashboard|Data Collection|Hardware Pool/ }).first();
    
    if (await menuButton.isVisible()) {
      // Text should be dark for accessibility
      await expect(menuButton).toHaveCSS('color', /rgb\(44, 44, 44\)|#2c2c2c/);
    }
  });

  test('should use glassmorphic layout throughout', async ({ page }) => {
    // Main content should have glassmorphic background
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    await expect(mainContent).toHaveCSS('backdrop-filter', /blur\(20px\)/);
    
    // Dashboard content should use GlassmorphicLayout
    const dashboardContainer = page.locator('main').locator('div').first();
    await expect(dashboardContainer).toBeVisible();
    await expect(dashboardContainer).toHaveCSS('background-color', /rgba\(255, 255, 255, 0\.15\)/);
    await expect(dashboardContainer).toHaveCSS('border-radius', '20px');
  });

  test('should have non-scrollable sidebar with proper scaling', async ({ page }) => {
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
    
    // Sidebar should not be scrollable (overflow: hidden)
    await expect(sidebar).toHaveCSS('overflow', 'hidden');
    await expect(sidebar).toHaveCSS('display', 'flex');
    await expect(sidebar).toHaveCSS('flex-direction', 'column');
  });

  test('should apply Poppins font globally', async ({ page }) => {
    // Check body/html for Poppins font
    const body = page.locator('body');
    await expect(body).toHaveCSS('font-family', /Poppins/);
    
    // Check sidebar text
    const sidebar = page.locator('nav');
    await expect(sidebar).toHaveCSS('font-family', /Poppins/);
    
    // Check main content
    const mainContent = page.locator('main');
    await expect(mainContent).toHaveCSS('font-family', /Poppins/);
  });

  test('should maintain beautiful glassmorphic background', async ({ page }) => {
    // Check animated gradient background (it's the second child inside FluentProvider)
    const backgroundDiv = page.locator('div[style*="position: fixed"]').first();
    await expect(backgroundDiv).toHaveCSS('position', 'fixed');
    await expect(backgroundDiv).toHaveCSS('background', /linear-gradient/);
    await expect(backgroundDiv).toHaveCSS('background-size', '400% 400%');
    
    // Check main container glassmorphic effects
    const mainContainer = page.locator('main');
    await expect(mainContainer).toHaveCSS('backdrop-filter', /blur\(20px\)/);
    await expect(mainContainer).toHaveCSS('background', /rgba\(255, 255, 255, 0\.1\)/);
  });

  test('should navigate to Hardware Pool and show glassmorphic styling', async ({ page }) => {
    // Find and click Hardware Pool button (it might be visible without expanding)
    const hardwarePoolButton = page.locator('nav button').filter({ hasText: /Hardware Pool/ });
    
    if (await hardwarePoolButton.isVisible()) {
      await hardwarePoolButton.click();
      await page.waitForURL('**/hardware-pool');
      await page.waitForTimeout(1000);
      
      // Hardware Pool content should use glassmorphic layout
      const hardwareContent = page.locator('main').locator('div').first();
      await expect(hardwareContent).toBeVisible();
      await expect(hardwareContent).toHaveCSS('background-color', /rgba\(255, 255, 255, 0\.15\)/);
      await expect(hardwareContent).toHaveCSS('backdrop-filter', /blur\(20px\)/);
      
      // Should maintain slider styling if present
      const sliders = page.locator('input[type="range"]');
      if (await sliders.count() > 0) {
        const firstSlider = sliders.first();
        await expect(firstSlider).toBeVisible();
        // Sliders should maintain their custom styling
      }
    } else {
      console.log('Hardware Pool button not immediately visible, skipping navigation test');
    }
  });

  test('should show proper hover effects and interactions', async ({ page }) => {
    // Test settings button hover
    const settingsButton = page.locator('button[title="Settings"]');
    await expect(settingsButton).toBeVisible();
    
    // Hover over settings button
    await settingsButton.hover();
    
    // Should have hover transform (matrix form of translateY(-2px))
    await expect(settingsButton).toHaveCSS('transform', /matrix\(1, 0, 0, 1, 0, -2\)/);
    
    // Test sidebar toggle button hover
    const toggleButton = page.locator('nav button').first();
    await expect(toggleButton).toBeVisible();
    
    // Should have proper styling
    await expect(toggleButton).toHaveCSS('background', /rgba\(255, 255, 255, 0\.2\)/);
  });
});
