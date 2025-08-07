import { test, expect } from '@playwright/test';

test.describe('Fluent UI 2 Icons Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
  });

  test('should display proper Fluent UI icons in navigation sidebar', async ({ page }) => {
    // Test navigation toggle button with Fluent UI icon
    const navButton = page.locator('nav button').first();
    await expect(navButton).toBeVisible();
    
    // Check that the navigation button contains SVG (Fluent UI icons render as SVG)
    const navButtonSvg = navButton.locator('svg');
    await expect(navButtonSvg).toBeVisible();

    // Expand sidebar to see all icons
    await navButton.click();
    await page.waitForTimeout(500); // Wait for animation

    // Test main menu items have proper icons
    const mainMenuItems = [
      { text: 'Dashboard', expectedIcon: 'HomeRegular' },
      { text: 'Data Collection', expectedIcon: 'DatabaseRegular' },
      { text: 'Hardware Pool', expectedIcon: 'ServerRegular' },
      { text: 'Migration Planner', expectedIcon: 'ArrowSyncRegular' },
      { text: 'Cluster Sizing', expectedIcon: 'ResizeRegular' },
      { text: 'Network Visualizer', expectedIcon: 'GlobeRegular' },
      { text: 'Lifecycle Planning', expectedIcon: 'CalendarRegular' },
      { text: 'Design Documents', expectedIcon: 'DocumentRegular' }
    ];

    for (const item of mainMenuItems) {
      const menuButton = page.locator('nav button', { hasText: item.text });
      await expect(menuButton).toBeVisible();
      
      // Each menu item should have an SVG icon
      const iconSvg = menuButton.locator('div').first().locator('svg');
      await expect(iconSvg).toBeVisible();
    }

    // Test project menu items have proper icons
    const projectMenuItems = [
      { text: 'Project Management', expectedIcon: 'FolderRegular' },
      { text: 'Workflows', expectedIcon: 'FlashRegular' },
      { text: 'Settings', expectedIcon: 'SettingsRegular' }
    ];

    for (const item of projectMenuItems) {
      const menuButton = page.locator('nav button', { hasText: item.text });
      await expect(menuButton).toBeVisible();
      
      // Each menu item should have an SVG icon
      const iconSvg = menuButton.locator('div').first().locator('svg');
      await expect(iconSvg).toBeVisible();
    }
  });

  test('should show filled icons when menu items are active', async ({ page }) => {
    // Navigate to a specific page
    await page.locator('nav button').first().click(); // Open sidebar
    await page.waitForTimeout(300);
    
    const dataCollectionButton = page.locator('nav button', { hasText: 'Data Collection' });
    await dataCollectionButton.click();
    await page.waitForTimeout(500);

    // Check that the active item has different styling
    await expect(dataCollectionButton).toHaveCSS('background-color', /rgba\(255, 255, 255, 0\.3\)/);
    
    // The icon should be visible and styled differently when active
    const activeIconDiv = dataCollectionButton.locator('div').first();
    await expect(activeIconDiv).toBeVisible();
    const activeIconSvg = activeIconDiv.locator('svg');
    await expect(activeIconSvg).toBeVisible();
  });

  test('should have proper hover effects on menu items', async ({ page }) => {
    // Open sidebar
    await page.locator('nav button').first().click();
    await page.waitForTimeout(300);

    const dashboardButton = page.locator('nav button', { hasText: 'Dashboard' });
    
    // Hover over menu item
    await dashboardButton.hover();
    await page.waitForTimeout(200);

    // Should have hover background (not exact match due to transitions)
    await expect(dashboardButton).toHaveCSS('transform', 'translateY(-2px)');
  });

  test('should display proper badges with Fluent UI styling', async ({ page }) => {
    // Open sidebar
    await page.locator('nav button').first().click();
    await page.waitForTimeout(300);

    // Check Hardware Pool has "New" badge
    const hardwarePoolButton = page.locator('nav button', { hasText: 'Hardware Pool' });
    await expect(hardwarePoolButton).toBeVisible();
    
    const badge = hardwarePoolButton.locator('span', { hasText: 'NEW' });
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS('background', /linear-gradient/);
  });

  test('should maintain glassmorphic design with Fluent UI icons', async ({ page }) => {
    // Check main background has animated gradient
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check sidebar has proper glassmorphic background
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveCSS('backdrop-filter', /blur\(40px\)/);
    await expect(sidebar).toHaveCSS('background-color', /rgba\(255, 255, 255, 0\.25\)/);

    // Check main content area has glassmorphic styling
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
    await expect(mainContent).toHaveCSS('backdrop-filter', /blur\(20px\)/);
  });

  test('should be responsive and work in collapsed sidebar mode', async ({ page }) => {
    // Start with expanded sidebar
    await page.locator('nav button').first().click();
    await page.waitForTimeout(300);

    // Collapse sidebar
    await page.locator('nav button').first().click();
    await page.waitForTimeout(500);

    // Check sidebar is collapsed
    const sidebar = page.locator('nav');
    await expect(sidebar).toHaveCSS('width', '60px');

    // Icons should still be visible in collapsed mode
    const firstMenuButton = page.locator('nav').locator('button').nth(1); // Skip toggle button
    await expect(firstMenuButton).toBeVisible();
    
    const iconSvg = firstMenuButton.locator('div').first().locator('svg');
    await expect(iconSvg).toBeVisible();

    // Text should not be visible in collapsed mode
    const menuText = firstMenuButton.locator('span', { hasText: 'Dashboard' });
    await expect(menuText).not.toBeVisible();
  });

  test('should have proper color contrast and accessibility', async ({ page }) => {
    // Open sidebar
    await page.locator('nav button').first().click();
    await page.waitForTimeout(300);

    // Check text color contrast on glassmorphic background
    const menuButton = page.locator('nav button', { hasText: 'Dashboard' });
    await expect(menuButton).toHaveCSS('color', /rgba\(255, 255, 255/);
    
    // Icons should be properly colored
    const iconSvg = menuButton.locator('div').first().locator('svg');
    await expect(iconSvg).toBeVisible();
    
    // Check that SVG has proper fill/stroke (Fluent UI icons use currentColor)
    const iconPath = iconSvg.locator('path').first();
    await expect(iconPath).toBeVisible();
  });
});
