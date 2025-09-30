import { test, expect } from '@playwright/test';

test.describe('Complete User Journey Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.waitForLoadState('networkidle');
  });

  test('complete capacity analysis workflow', async ({ page }) => {
    // Navigate to Capacity Visualizer
    await page.click('text=Capacity Visualizer');
    await page.waitForLoadState('networkidle');
    
    // Check that the visualizer loads properly
    await expect(page.locator('[data-testid="capacity-visualizer"]')).toBeVisible();
    
    // Test visualization mode switching
    await page.click('[data-testid="memory-mode-button"]');
    await expect(page.locator('[data-testid="memory-chart"]')).toBeVisible();
    
    await page.click('[data-testid="storage-mode-button"]');
    await expect(page.locator('[data-testid="storage-chart"]')).toBeVisible();
    
    // Test search functionality
    await page.fill('[data-testid="vm-search"]', 'web-server');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Test VM selection
    await page.click('[data-testid="vm-checkbox"]:first-child');
    await expect(page.locator('[data-testid="selected-vms-count"]')).toContainText('1');
  });

  test('hardware basket management workflow', async ({ page }) => {
    // Navigate to vendor data collection
    await page.click('text=Data Collection');
    await page.waitForLoadState('networkidle');
    
    // Switch to hardware basket tab
    await page.click('text=Hardware Basket');
    await page.waitForLoadState('networkidle');
    
    // Check hardware baskets are displayed
    await expect(page.locator('[data-testid="hardware-baskets-list"]')).toBeVisible();
    
    // Test search functionality
    await page.fill('[data-testid="basket-search"]', 'Dell');
    await page.waitForTimeout(500);
    
    // Test basket actions
    const firstBasket = page.locator('[data-testid="basket-item"]').first();
    await expect(firstBasket).toBeVisible();
    
    // Test basket details view
    await firstBasket.click();
    await expect(page.locator('[data-testid="basket-details"]')).toBeVisible();
  });

  test('project management workflow', async ({ page }) => {
    // Navigate to projects
    await page.click('text=Projects');
    await page.waitForLoadState('networkidle');
    
    // Check projects are displayed
    await expect(page.locator('[data-testid="projects-grid"]')).toBeVisible();
    
    // Test project creation
    await page.click('[data-testid="create-project-button"]');
    await expect(page.locator('[data-testid="project-creation-modal"]')).toBeVisible();
    
    // Fill project details
    await page.fill('[data-testid="project-name-input"]', 'Test Project');
    await page.fill('[data-testid="project-description-input"]', 'Test project description');
    
    // Submit project
    await page.click('[data-testid="submit-project-button"]');
    await page.waitForLoadState('networkidle');
    
    // Verify project was created
    await expect(page.locator('text=Test Project')).toBeVisible();
  });

  test('file upload and processing workflow', async ({ page }) => {
    // Navigate to data collection
    await page.click('text=Data Collection');
    await page.waitForLoadState('networkidle');
    
    // Go to upload section
    await page.click('text=Upload');
    await page.waitForLoadState('networkidle');
    
    // Check upload areas are available
    await expect(page.locator('[data-testid="dell-upload-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="lenovo-upload-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="hpe-upload-area"]')).toBeVisible();
    
    // Test drag and drop indication
    const uploadArea = page.locator('[data-testid="dell-upload-area"]');
    await uploadArea.hover();
    
    // Check for upload instructions
    await expect(page.locator('text=Drop files here or click to browse')).toBeVisible();
  });

  test('responsive design across viewports', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:1420');
      await page.waitForLoadState('networkidle');
      
      // Check main navigation is accessible
      const nav = page.locator('[data-testid="main-navigation"]');
      await expect(nav).toBeVisible();
      
      // Check responsive behavior
      if (viewport.width < 768) {
        // Mobile: Check hamburger menu
        await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      } else {
        // Desktop/Tablet: Check full navigation
        await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible();
      }
      
      // Check content is accessible and not cut off
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
      
      const contentBox = await mainContent.boundingBox();
      expect(contentBox?.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('error handling and recovery', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('http://localhost:1420/data-collection');
    await page.waitForLoadState('networkidle');
    
    // Should show error message gracefully
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible();
    await expect(page.locator('text=Unable to load data')).toBeVisible();
    
    // Test retry functionality
    await page.unroute('**/api/**');
    await page.click('[data-testid="retry-button"]');
    await page.waitForLoadState('networkidle');
    
    // Should recover and show content
    await expect(page.locator('[data-testid="error-banner"]')).not.toBeVisible();
  });

  test('keyboard navigation and accessibility', async ({ page }) => {
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Should focus on first focusable element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Navigate through main menu items
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    // Test Enter key activation
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
    
    // Check aria labels and roles
    const navigation = page.locator('[role="navigation"]');
    await expect(navigation).toBeVisible();
    
    const buttons = page.locator('button[aria-label]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });
});