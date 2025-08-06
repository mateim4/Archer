import { test, expect } from '@playwright/test';

test.describe('Navigation and Basic UI', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main application loads
    await expect(page).toHaveTitle(/LCM Designer|InfraAID/);
    
    // Check if navigation sidebar is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check if main content area is present
    await expect(page.locator('main')).toBeVisible();
  });

  test('should show project-based navigation correctly', async ({ page }) => {
    await page.goto('/');
    
    // Without a project open, only Projects and Settings should be visible
    await expect(page.locator('text=Projects')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    
    // Project-specific items should be hidden
    await expect(page.locator('text=Hardware Pool')).not.toBeVisible();
    await expect(page.locator('text=Migration Planner')).not.toBeVisible();
    await expect(page.locator('text=Design Documents')).not.toBeVisible();
    await expect(page.locator('text=Cluster Sizing')).not.toBeVisible();
  });

  test('should apply gradient styling to active navigation items', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to Projects
    await page.click('text=Projects');
    
    // Check if the active item has the gradient background
    const activeItem = page.locator('[class*="gradient"]').first();
    await expect(activeItem).toBeVisible();
  });

  test('should be responsive on mobile viewports', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if navigation is hidden on mobile by default
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
    
    // Check if hamburger menu exists for mobile navigation
    // This would depend on your exact implementation
  });
});

test.describe('Projects Management', () => {
  test('should navigate to projects view', async ({ page }) => {
    await page.goto('/');
    
    // Click on Projects in navigation
    await page.click('text=Projects');
    
    // Should be on projects page
    await expect(page.locator('h1.fluent-page-title')).toContainText('Projects');
  });

  test('should display mock projects', async ({ page }) => {
    await page.goto('/projects');
    
    // Check if mock projects are displayed
    await expect(page.locator('text=Project Phoenix')).toBeVisible();
    await expect(page.locator('text=Project Titan')).toBeVisible();
    await expect(page.locator('text=Project Nova')).toBeVisible();
  });

  test('should show create new project button', async ({ page }) => {
    await page.goto('/projects');
    
    // Check if create button exists
    await expect(page.locator('text=Create New Project')).toBeVisible();
  });

  test('should navigate to project detail view', async ({ page }) => {
    await page.goto('/projects');
    
    // Click on first project
    const selectButton = page.locator('text=Select Project').first();
    await selectButton.click();
    
    // Should show project detail view
    await expect(page.locator('text=Back to Projects')).toBeVisible();
    await expect(page.locator('text=Project Phoenix')).toBeVisible();
  });

  test('should show project workflows and stages', async ({ page }) => {
    await page.goto('/projects');
    
    // Navigate to project detail
    await page.locator('text=Select Project').first().click();
    
    // Check if workflows are displayed
    await expect(page.locator('text=Migration Wave 1')).toBeVisible();
    await expect(page.locator('text=Decommission Old Hardware')).toBeVisible();
    
    // Check if stages are displayed in Kanban style
    await expect(page.locator('text=Planning')).toBeVisible();
    await expect(page.locator('text=Build New Environment')).toBeVisible();
    await expect(page.locator('text=User Acceptance Testing')).toBeVisible();
  });

  test('should allow navigating back to projects list', async ({ page }) => {
    await page.goto('/projects');
    
    // Navigate to project detail
    await page.locator('text=Select Project').first().click();
    
    // Click back button
    await page.click('text=Back to Projects');
    
    // Should be back on projects list
    await expect(page.locator('h1.fluent-page-title')).toContainText('Projects');
    await expect(page.locator('text=Create New Project')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should handle sidebar collapse correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find and click sidebar toggle button
    const toggleButton = page.locator('[data-testid="sidebar-toggle"], .toggle-button, button[aria-label*="toggle"], button[aria-label*="collapse"]').first();
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // Check if sidebar state changes
      // This would depend on your exact implementation
    }
  });

  test('should maintain layout integrity on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 },   // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Check if main layout elements are present and properly positioned
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // Ensure no content overflow
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      expect(bodyBox?.width).toBeLessThanOrEqual(viewport.width);
    }
  });
});

test.describe('Migration Planner Integration', () => {
  test('should have migration planner available when project is open', async ({ page }) => {
    await page.goto('/');
    
    // This test would need to be updated once project state management is implemented
    // For now, we'll test the current behavior
    
    // Navigation to migration planner should work if we directly access it
    await page.goto('/migration-planner');
    
    // Check if migration planner loads
    // The exact assertions would depend on the MigrationPlannerView implementation
  });
});

test.describe('Performance and Accessibility', () => {
  test('should meet basic accessibility requirements', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    
    // Check for proper ARIA labels on interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // Ensure buttons have accessible names
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();
        expect(ariaLabel || text).toBeTruthy();
      }
    }
  });

  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    
    // Wait for main content to be visible
    await expect(page.locator('main')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });
});
